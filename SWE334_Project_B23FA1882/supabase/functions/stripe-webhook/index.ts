import Stripe from 'npm:stripe@^22'
import { withSupabase } from 'npm:@supabase/server@^1'

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
const stripe = stripeKey ? new Stripe(stripeKey) : null
const cryptoProvider = Stripe.createSubtleCryptoProvider()

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
    if (!stripe || !webhookSecret) return new Response('Missing webhook configuration', { status: 503 })
    const signature = req.headers.get('stripe-signature') ?? ''
    const body = await req.text()
    let event: Stripe.Event
    try {
      event = await stripe.webhooks.constructEventAsync(
        body, signature, webhookSecret, undefined, cryptoProvider,
      )
    } catch (error) {
      console.error('Stripe signature invalid', error)
      return new Response('Invalid webhook signature', { status: 400 })
    }

    if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded')
      return Response.json({ received: true })

    const session = event.data.object as Stripe.Checkout.Session
    if (session.payment_status !== 'paid') return Response.json({ received: true })
    const orderId = session.metadata?.order_id
    if (!orderId) return new Response('Missing order ID', { status: 400 })

    // Verify actual session ID, paid amount and currency against database records.
    const { data: order, error: lookupError } = await ctx.supabaseAdmin.from('orders')
      .select('id,status,total_amount,payment_ref').eq('id', orderId).single()
    if (lookupError || !order) return new Response('Order not found', { status: 404 })
    if (order.payment_ref !== session.id || session.currency?.toLowerCase() !== 'mnt'
        || session.amount_total !== Math.round(Number(order.total_amount) * 100))
      return new Response('Payment/order mismatch', { status: 400 })
    if (order.status === 'cancelled') return new Response('Order cancelled', { status: 409 })

    const { error: paymentError } = await ctx.supabaseAdmin.from('payments').upsert({
      order_id: order.id, provider: 'stripe', external_id: session.id,
      amount: Number(order.total_amount), status: 'paid',
    }, { onConflict: 'external_id' })
    if (paymentError) { console.error(paymentError); return new Response('Could not record payment', { status: 500 }) }
    const { error: updateError } = await ctx.supabaseAdmin.from('orders')
      .update({ status: 'paid' }).eq('id', order.id).eq('status', 'pending')
    if (updateError) { console.error(updateError); return new Response('Could not update order', { status: 500 }) }
    return Response.json({ received: true })
  }),
}
