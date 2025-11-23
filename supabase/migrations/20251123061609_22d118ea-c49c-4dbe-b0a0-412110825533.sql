-- Add payment-related columns to orders table
ALTER TABLE public.orders 
ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cod',
ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN razorpay_order_id TEXT,
ADD COLUMN razorpay_payment_id TEXT;

-- Add check constraint for payment_method
ALTER TABLE public.orders 
ADD CONSTRAINT orders_payment_method_check 
CHECK (payment_method IN ('razorpay', 'cod'));

-- Add check constraint for payment_status
ALTER TABLE public.orders 
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('pending', 'completed', 'failed'));

-- Add index for faster lookups
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_razorpay_order_id ON public.orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;