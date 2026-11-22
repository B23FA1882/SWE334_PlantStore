-- Server-only QPay payment confirmation.
-- The caller must verify the invoice through the real QPay Merchant V2 API first.
-- All three records update atomically; arbitrary browser input cannot call this RPC.

CREATE OR REPLACE FUNCTION public.confirm_qpay_payment_service(
  p_order_id uuid,
  p_invoice_id text,
  p_payment_id text,
  p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_invoice public.qpay_invoices%ROWTYPE;
BEGIN
  IF p_order_id IS NULL OR p_invoice_id IS NULL OR length(p_invoice_id) > 500
      OR p_payment_id IS NULL OR length(p_payment_id) > 500
      OR p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid QPay confirmation input';
  END IF;

  SELECT * INTO v_order FROM public.orders
  WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  IF v_order.payment_ref IS DISTINCT FROM 'qpay:' || p_invoice_id
     OR v_order.total_amount <> p_amount THEN
    RAISE EXCEPTION 'QPay invoice/order mismatch';
  END IF;

  SELECT * INTO v_invoice FROM public.qpay_invoices
  WHERE order_id = p_order_id AND invoice_id = p_invoice_id
  FOR UPDATE;
  IF NOT FOUND OR v_invoice.status = 'cancelled' THEN
    RAISE EXCEPTION 'QPay invoice not active';
  END IF;

  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled order cannot be paid';
  END IF;

  -- Idempotency if Stripe/QPay sends repeated payment notifications.
  IF v_order.status = 'paid' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.order_id = p_order_id
        AND p.provider = 'qpay'
        AND p.external_id = p_payment_id
        AND p.status = 'paid'
        AND p.amount = p_amount
    ) THEN
      RAISE EXCEPTION 'Order already paid by another payment';
    END IF;
    RETURN;
  END IF;
  IF v_order.status <> 'pending' THEN RAISE EXCEPTION 'Unexpected order status'; END IF;

  INSERT INTO public.payments (order_id, provider, external_id, amount, status)
  VALUES (p_order_id, 'qpay', p_payment_id, p_amount, 'paid')
  ON CONFLICT (external_id) DO NOTHING;

  IF NOT EXISTS (
    SELECT 1 FROM public.payments p
    WHERE p.order_id = p_order_id
      AND p.provider = 'qpay'
      AND p.external_id = p_payment_id
      AND p.status = 'paid'
      AND p.amount = p_amount
  ) THEN
    RAISE EXCEPTION 'Payment ID already belongs to another order';
  END IF;

  UPDATE public.orders SET status = 'paid'
  WHERE id = p_order_id AND status = 'pending';
  UPDATE public.qpay_invoices SET status = 'paid'
  WHERE order_id = p_order_id AND invoice_id = p_invoice_id;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_qpay_payment_service(uuid,text,text,numeric)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_qpay_payment_service(uuid,text,text,numeric)
TO service_role;
