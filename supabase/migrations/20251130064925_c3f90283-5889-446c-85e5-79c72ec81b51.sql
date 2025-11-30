-- Add columns for weight-based product customization
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS min_weight_grams integer DEFAULT 250,
ADD COLUMN IF NOT EXISTS allow_custom_weight boolean DEFAULT true;

COMMENT ON COLUMN public.products.min_weight_grams IS 'Minimum weight in grams for weight-based products, used as starting point for custom weight selection';
COMMENT ON COLUMN public.products.allow_custom_weight IS 'Whether customers can select custom weights beyond predefined options';