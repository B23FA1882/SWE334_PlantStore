import { withSupabase } from 'npm:@supabase/server@^1'
import { isQPayConfigured, qpayRequest, QPayError, validUUID } from '../_shared/qpay.ts'

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return Response.json({ error: 'Зөвшөөрөгдөөгүй хүсэлт.' }, { status: 405 })
    try {
      if (!isQPayConfigured()) throw new QPayError(503, 'QPay sandbox тохиргоо хийгдээгүй байна. Мерчантын эрхээ холбоно уу.')
      const { data: { user }, error: authError } = await ctx.supabase.auth.getUser()
      if (authError || !user) throw new QPayError(401, 'Эхлээд нэвтэрнэ үү.')
      const { orderId } = await req.json()
      if (!validUUID(orderId)) throw new QPayError(400, 'Захиалгын ID буруу байна.')

      const { data: order, error: orderError } = await ctx.supabase.from('orders')
        .select('id,user_id,status,total_amount,payment_ref').eq('id', orderId).eq('user_id', user.id).single()
      if (orderError || !order) throw new QPayError(404, 'Захиалга олдсонгүй.')
      if (order.status !== 'pending') throw new QPayError(409, 'Зөвхөн хүлээгдэж буй захиалгад төлбөр үүсгэнэ.')
      const amount = Number(order.total_amount)
      if (!Number.isSafeInteger(amount) || amount < 1) throw new QPayError(400, 'Захиалгын дүн буруу байна.')

      // Return previously stored QPay QR instead of creating multiple invoices.
      const { data: existing } = await ctx.supabaseAdmin.from('qpay_invoices')
        .select('invoice_id,qr_image,qr_text,urls').eq('order_id', order.id).maybeSingle()
      if (existing) return Response.json({ ...existing, amount, provider: 'qpay', status: 'pending' })
      if (order.payment_ref) throw new QPayError(409, 'Энэ захиалгад өмнө нь өөр төлбөрийн нэхэмжлэх үүссэн. Шинэ захиалга үүсгэнэ үү.')

      const invoiceCode = Deno.env.get('QPAY_INVOICE_CODE')
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      if (!invoiceCode || !supabaseUrl) throw new QPayError(503, 'QPay callback тохиргоо дутуу байна.')
      const callbackUrl = new URL('/functions/v1/qpay-callback', supabaseUrl)
      callbackUrl.searchParams.set('order_id', order.id)

      const invoice = await qpayRequest('POST', '/v2/invoice', {
        invoice_code: invoiceCode,
        sender_invoice_no: order.id,
        invoice_receiver_code: Deno.env.get('QPAY_RECEIVER_CODE') || 'terminal',
        invoice_description: 'GREENROOM ургамлын захиалга #' + order.id.slice(0, 8),
        amount,
        callback_url: callbackUrl.toString(),
      })
      if (!invoice || typeof invoice.invoice_id !== 'string') throw new QPayError(502, 'QPay нэхэмжлэхийн ID ирсэнгүй.')
      const urls = Array.isArray(invoice.urls)
        ? invoice.urls.filter((item: any) => {
          if (typeof item?.link !== 'string' || item.link.length > 4000) return false
          try {
            const url = new URL(item.link)
            // QPay returns both https URLs and bank-specific deep-link protocols.
            // Forward them unmodified; block browser-injection schemes.
            return /^[a-z][a-z0-9+.-]*:$/.test(url.protocol) &&
              !['javascript:', 'data:', 'file:', 'blob:', 'vbscript:'].includes(url.protocol)
          } catch { return false }
        }).slice(0, 20)
        : []
      const qrImage = typeof invoice.qr_image === 'string' && invoice.qr_image.length < 900_000 ? invoice.qr_image : null
      const qrText = typeof invoice.qr_text === 'string' && invoice.qr_text.length < 12000 ? invoice.qr_text : null

      const { error: insertError } = await ctx.supabaseAdmin.from('qpay_invoices').insert({
        order_id: order.id, invoice_id: invoice.invoice_id,
        qr_image: qrImage, qr_text: qrText, urls,
      })
      if (insertError) {
        // Concurrent request: avoid leaving a second payable invoice.
        try { await qpayRequest('DELETE', '/v2/invoice/' + encodeURIComponent(invoice.invoice_id)) } catch {}
        throw new QPayError(409, 'Нэхэмжлэх давхар үүсэхээс сэргийлэв. Дахин оролдоно уу.')
      }
      const { data: updated, error: updateError } = await ctx.supabaseAdmin.from('orders')
        .update({ payment_ref: 'qpay:' + invoice.invoice_id })
        .eq('id', order.id).eq('user_id', user.id).eq('status', 'pending').is('payment_ref', null)
        .select('id')
      if (updateError || !updated?.length) {
        try { await qpayRequest('DELETE', '/v2/invoice/' + encodeURIComponent(invoice.invoice_id)) } catch {}
        await ctx.supabaseAdmin.from('qpay_invoices').delete().eq('order_id', order.id)
        throw new QPayError(409, 'Нэхэмжлэх хадгалах үед захиалгын төлөв өөрчлөгдсөн байна.')
      }
      return Response.json({ invoice_id: invoice.invoice_id, qr_image: qrImage, qr_text: qrText, urls, amount, provider: 'qpay', status: 'pending' })
    } catch (e) {
      console.error('QPay invoice error:', e instanceof Error ? e.message : 'unknown')
      return Response.json({ error: e instanceof QPayError ? e.message : 'QPay нэхэмжлэх үүсгэхэд алдаа гарлаа.' }, { status: e instanceof QPayError ? e.status : 500 })
    }
  }),
}
