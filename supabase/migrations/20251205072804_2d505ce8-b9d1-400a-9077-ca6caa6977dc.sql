-- Allow users to update their own orders (for cancellation within time window)
CREATE POLICY "Users can cancel their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);