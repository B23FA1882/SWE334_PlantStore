import { withSupabase } from 'npm:@supabase/server@^1'
import { QPayError, validUUID, verifyQPayPayment, recordQPayPayment, isQPayConfigured } from '../_shared/qpay.ts'

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return Response.json({ error: 'Зөвшөөрөгдөөгүй хүсэлт.' }, { status: 405 })
    try {
      if (!isQPayConfigured()) throw new QPayError(503, 'QPay sandbox тохиргоо дутуу байна.')
      const { data: { user }, error: authError } = await ctx.supabase.auth.getUser()
      if (authError || !user) throw new QPayError(401, 'Нэвтрэх шаардлагатай.')
      const { orderId } = await req.json()
      if (!validUUID(orderId)) throw new QPayError(400, 'Захиалгын дугаар буруу байна.')
      const { data: order, error } = await ctx.supabase.from('orders')
        .select('id,status,total_amount,payment_ref').eq('user_id', user.id).eq('id', orderId).single()
      if (error || !order) throw new QPayError(404, 'Захиалга олдсонгүй.')
      if (order.status === 'paid') return Response.json({ status: 'paid' })
      if (order.status !== 'pending' || !order.payment_ref?.startsWith('qpay:'))
        throw new QPayError(409, 'QPay нэхэмжлэх олдсонгүй.')
      const invoiceId = order.payment_ref.slice(5)
      const verification = await verifyQPayPayment(invoiceId, Number(order.total_amount))
      if (!verification.paid) return Response.json({ status: 'pending' })
      await recordQPayPayment(ctx.supabaseAdmin, order, verification.paymentId!)
      return Response.json({ status: 'paid' })
    } catch(e) {
      console.error('QPay status check failed:',e instanceof Error?e.message:'unknown')
      return Response.json({ error: e instanceof QPayError ? e.message : 'Төлбөр шалгах үед алдаа гарлаа.' }, { status: e instanceof QPayError ? e.status : 500 })
    }
  }),
}
