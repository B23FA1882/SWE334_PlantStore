// Shared QPay Merchant V2 sandbox helper — only imported by Supabase Edge Functions.
// Never put merchant credentials or access tokens into VITE_ variables.
const configuredBase = Deno.env.get('QPAY_BASE_URL') || 'https://merchant-sandbox.qpay.mn'
const ALLOWED = ['https://merchant-sandbox.qpay.mn', 'https://merchant.qpay.mn']
if (!ALLOWED.includes(configuredBase)) throw new Error('Unsupported QPay host')
const base = configuredBase
let tokenCache: { value: string; expiresAt: number } | null = null

export class QPayError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export const isQPayConfigured = () => Boolean(
  Deno.env.get('QPAY_CLIENT_ID') &&
  Deno.env.get('QPAY_CLIENT_SECRET') &&
  Deno.env.get('QPAY_INVOICE_CODE')
)

async function getAccessToken(force = false): Promise<string> {
  if (!force && tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.value
  const id = Deno.env.get('QPAY_CLIENT_ID')
  const secret = Deno.env.get('QPAY_CLIENT_SECRET')
  if (!id || !secret) throw new QPayError(503, 'QPay мерчантын нэвтрэх эрх тохируулаагүй байна.')
  const response = await fetch(base + '/v2/auth/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(id + ':' + secret),
      Accept: 'application/json',
    },
  })
  if (!response.ok) throw new QPayError(502, 'QPay-ийн нэвтрэлтийн сервер хариу өгсөнгүй.')
  const data = await response.json()
  if (typeof data.access_token !== 'string') throw new QPayError(502, 'QPay access token буцаасангүй.')
  const expiry = Number(data.expires_in) * 1000  // QPay expires_in = Unix timestamp seconds
  tokenCache = { value: data.access_token, expiresAt: Number.isFinite(expiry) && expiry > Date.now() ? expiry - 60_000 : Date.now() + 5 * 60_000 }
  return data.access_token
}

export async function qpayRequest(method: 'POST' | 'DELETE' | 'GET', path: string, body?: unknown): Promise<any> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getAccessToken(attempt > 0)
    const response = await fetch(base + path, {
      method,
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    if ((response.status === 401 || response.status === 403) && attempt === 0) {
      tokenCache = null
      continue
    }
    if (!response.ok) throw new QPayError(502, 'QPay API алдаа (' + response.status + '). Тохиргоогоо шалгана уу.')
    const text = await response.text()
    if (!text) return {}
    try { return JSON.parse(text) } catch { throw new QPayError(502, 'QPay серверийн хариу буруу байна.') }
  }
  throw new QPayError(502, 'QPay нэвтрэлтийн тохиргоог шалгана уу.')
}

export function validUUID(id: unknown): id is string {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export async function verifyQPayPayment(invoiceId: string, amount: number) {
  const result = await qpayRequest('POST', '/v2/payment/check', {
    object_type: 'INVOICE', object_id: invoiceId, offset: { page_number: 1, page_limit: 100 },
  })
  const payments = Array.isArray(result?.rows) ? result.rows : []
  const paidTotal = Number(result?.paid_amount)
  const paid = payments.find((row: any) =>
    row?.payment_status === 'PAID' &&
    row?.payment_currency === 'MNT' &&
    typeof row?.payment_id === 'string' &&
    Number(row?.payment_amount) === amount
  )
  return { paid: Boolean(paid && paidTotal === amount), paymentId: paid?.payment_id || null }
}

export async function recordQPayPayment(admin: any, order: any, paymentId: string) {
  if (order.status === 'cancelled') throw new QPayError(409, 'Цуцлагдсан захиалгад төлбөр бүртгэхгүй.')
  if (order.status === 'pending') {
    const { data, error } = await admin.from('orders')
      .update({ status: 'paid' }).eq('id', order.id).eq('status', 'pending').select('id')
    if (error || !data?.length) throw new QPayError(409, 'Захиалгын төлөв өөрчлөгдсөн байна.')
  }
  const { error: paymentError } = await admin.from('payments').upsert({
    order_id: order.id, provider: 'qpay', external_id: paymentId,
    amount: Number(order.total_amount), status: 'paid',
  }, { onConflict: 'external_id' })
  if (paymentError) throw new QPayError(500, 'Төлбөрийн бүртгэлийг хадгалж чадсангүй.')
  await admin.from('qpay_invoices').update({ status: 'paid' }).eq('order_id', order.id)
}
