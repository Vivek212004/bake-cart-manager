-- Add delivery_person_id column to orders table
ALTER TABLE public.orders 
ADD COLUMN delivery_person_id UUID REFERENCES auth.users(id);

-- Add index for delivery person lookups
CREATE INDEX idx_orders_delivery_person ON public.orders(delivery_person_id) WHERE delivery_person_id IS NOT NULL;

-- RLS policy for delivery persons to view their assigned orders
CREATE POLICY "Delivery persons can view assigned orders"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'delivery_person'
  )
  AND delivery_person_id = auth.uid()
);

-- RLS policy for delivery persons to view order items of their assigned orders
CREATE POLICY "Delivery persons can view items of assigned orders"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.orders
    JOIN public.user_roles ON user_roles.user_id = auth.uid()
    WHERE orders.id = order_items.order_id
    AND orders.delivery_person_id = auth.uid()
    AND user_roles.role = 'delivery_person'
  )
);

-- Allow admins to assign delivery persons
CREATE POLICY "Admins can update delivery person assignment"
ON public.orders
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));