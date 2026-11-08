import Stripe from 'npm:stripe@^22'
import { withSupabase } from 'npm:@supabase/server@^1'

// User-scoped cancellation. The browser never receives Stripe or service-role secrets.
const key = Deno.env.get('STRIPE_SECRET_KEY')
const stripe = key ? new Stripe(key) : null

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 })

    try {
      // Do not trust a user_id passed in the request body.
      const { data: { user }, error: authError } = await ctx.supabase.auth.getUser()
      if (authError || !user) return Response.json({ error: 'Нэвтэрнэ үү.' }, { status: 401 })

      const body = await req.json().catch(() => null)
      const orderId = body?.orderId
      if (typeof orderId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(orderId))
        return Response.json({ error: 'Захиалгын ID буруу байна.' }, { status: 400 })

      // Customer-RLS and explicit owner check.
      const { data: order, error: orderError } = await ctx.supabase
        .from('orders')
        .select('id,status,payment_ref')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single()
      if (orderError || !order) return Response.json({ error: 'Захиалга олдсонгүй.' }, { status: 404 })
      if (order.status !== 'pending')
        return Response.json({ error: 'Зөвхөн хүлээгдэж буй захиалгыг цуцална.' }, { status: 409 })

      // A previously opened Stripe Checkout must be closed FIRST.
      // A completed or paid session must never be cancelled or restocked.
      if (order.payment_ref) {
        if (!stripe) return Response.json({ error: 'Төлбөрийн серверийн тохиргоо дутуу байна.' }, { status: 503 })
        const session = await stripe.checkout.sessions.retrieve(order.payment_ref)
        if (session.status === 'open') {
          await stripe.checkout.sessions.expire(session.id)
        } else if (session.status !== 'expired') {
          return Response.json({
            error: 'Checkout төлбөр хийгдсэн эсвэл боловсруулагдаж байна. Захиалгыг цуцлах боломжгүй.'
          }, { status: 409 })
        }
      }

      // Only service_role can execute this transactional DB operation.
      // It atomically marks the customer's pending order cancelled and restores stock once.
      const { error: cancelError } = await ctx.supabaseAdmin.rpc('cancel_order_service', {
        p_order_id: order.id,
        p_user_id: user.id,
      })
      if (cancelError) {
        console.error('cancel_order_service failed:', cancelError.code, cancelError.message)
        return Response.json({ error: 'Захиалга цуцлагдсангүй. Шинэчлээд дахин шалгана уу.' }, { status: 409 })
      }
      return Response.json({ status: 'cancelled' })
    } catch (error) {
      console.error('Order cancellation error:', error instanceof Error ? error.message : 'Unknown')
      return Response.json({ error: 'Stripe checkout-ийг шалгаж чадсангүй. Түр хүлээгээд дахин оролдоно уу.' }, { status: 502 })
    }
  }),
}
