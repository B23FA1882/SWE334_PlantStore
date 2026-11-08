import Stripe from 'npm:stripe@^22'
import { withSupabase } from 'npm:@supabase/server@^1'

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
const siteUrl = Deno.env.get('SITE_URL')
const stripe = stripeKey ? new Stripe(stripeKey) : null

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 })
    if (!stripe || !siteUrl) return Response.json({ error: 'Stripe test settings are missing' }, { status: 503 })
    try {
      const { orderId } = await req.json()
      if (typeof orderId !== 'string' || !/^[0-9a-f-]{36}$/i.test(orderId))
        return Response.json({ error: 'Invalid order ID' }, { status: 400 })

      // RLS ensures a customer can only request checkout for their OWN order.
      const { data: order, error } = await ctx.supabase.from('orders')
        .select('id,status,total_amount,order_items(quantity,unit_price,products(name))')
        .eq('id', orderId).single()
      if (error || !order) return Response.json({ error: 'Order not found' }, { status: 404 })
      if (order.status !== 'pending') return Response.json({ error: 'Order is not pending' }, { status: 409 })
      if (!order.order_items?.length) return Response.json({ error: 'Empty order' }, { status: 400 })
      const computed = order.order_items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0)
      if (Math.round(computed * 100) !== Math.round(Number(order.total_amount) * 100)) {
        return Response.json({ error: 'Order total mismatch' }, { status: 409 })
      }
      const origin = new URL(siteUrl).origin
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        client_reference_id: order.id,
        metadata: { order_id: order.id },
        line_items: order.order_items.map((item) => ({
          price_data: {
            currency: 'mnt',
            unit_amount: Math.round(Number(item.unit_price) * 100),
            product_data: { name: item.products?.name || 'Office plant' },
          },
          quantity: item.quantity,
        })),
        success_url: `${origin}/orders?checkout=return`,
        cancel_url: `${origin}/orders?checkout=cancelled`,
      })
      const { error: saveError } = await ctx.supabaseAdmin.from('orders')
        .update({ payment_ref: session.id }).eq('id', order.id).eq('status', 'pending')
      if (saveError) throw saveError
      return Response.json({ url: session.url })
    } catch (error) {
      console.error('Checkout failed', error)
      return Response.json({ error: 'Could not start checkout' }, { status: 500 })
    }
  }),
}
