-- GREENROOM: A Stripe Checkout must be expired by the trusted Edge Function
-- before calling this service_role-only transactional operation.
-- Customers cannot call this function via browser / REST.

CREATE OR REPLACE FUNCTION public.cancel_order_service(
    p_order_id uuid,
    p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item RECORD;
BEGIN
  IF p_user_id IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'Invalid order or user';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending orders can be cancelled';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.payments
    WHERE order_id = p_order_id AND status = 'paid'
  ) THEN
    RAISE EXCEPTION 'This order has a paid payment';
  END IF;

  UPDATE public.orders
  SET status = 'cancelled'
  WHERE id = p_order_id AND status = 'pending';

  FOR v_item IN
    SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id
  LOOP
    UPDATE public.products
    SET stock = stock + v_item.quantity
    WHERE id = v_item.product_id;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_order_service(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order_service(uuid, uuid) TO service_role;
