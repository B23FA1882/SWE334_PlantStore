import { withSupabase } from 'npm:@supabase/server@^1'
import { QPayError, validUUID, verifyQPayPayment, recordQPayPayment, isQPayConfigured } from '../_shared/qpay.ts'

// A QPay callback is a notification, never proof of payment.
// Verify the merchant invoice directly with QPay before recording a payment.
export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    if (req.method !== 'GET' && req.method !== 'POST')
      return Response.json({ error: 'Method not allowed' }, { status: 405 })
    try {
      if (!isQPayConfigured()) throw new QPayError(503, 'QPay тохиргоо дутуу байна.')
      const url = new URL(req.url)
      const orderId = url.searchParams.get('order_id')
      if (!validUUID(orderId)) throw new QPayError(400, 'Invalid order ID')
      const { data: order, error } = await ctx.supabaseAdmin.from('orders')
        .select('id,status,total_amount,payment_ref').eq('id', orderId).single()
      if (error || !order) throw new QPayError(404, 'Захиалга олдсонгүй.')
      if (order.status === 'cancelled') throw new QPayError(409, 'Захиалга цуцлагдсан.')
      if (order.status === 'paid') return Response.json({ received: true, status: 'paid' })
      if (!order.payment_ref?.startsWith('qpay:')) throw new QPayError(409, 'QPay invoice not found')
      const invoiceId = order.payment_ref.slice(5)
      const checked = await verifyQPayPayment(invoiceId, Number(order.total_amount))
      if (!checked.paid) return Response.json({ received: true, status: 'pending' })
      await recordQPayPayment(ctx.supabaseAdmin, order, checked.paymentId!)
      return Response.json({ received: true, status: 'paid' })
    } catch(e) {
      console.error('QPay callback failed:',e instanceof Error?e.message:'unknown')
      return Response.json({ error: e instanceof QPayError ? e.message : 'Callback verification failed' }, { status: e instanceof QPayError ? e.status : 500 })
    }
  }),
}
