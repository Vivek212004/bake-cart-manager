-- Add pricing_type field to products table
-- Options: 'unit' (per piece), 'per_kg' (sold by weight), 'fixed_weight' (fixed weight packages like 250g, 500g)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS pricing_type text NOT NULL DEFAULT 'unit';

-- Add price_display_unit for custom labels (e.g., "per piece", "per 250g", "per pack")
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS price_display_unit text;

-- Update existing products: if is_sold_by_weight is true, set pricing_type to 'per_kg'
UPDATE public.products 
SET pricing_type = 'per_kg' 
WHERE is_sold_by_weight = true;

-- Comment for clarity
COMMENT ON COLUMN public.products.pricing_type IS 'Pricing type: unit (per piece), per_kg (by weight), fixed_weight (preset weight packages)';
COMMENT ON COLUMN public.products.price_display_unit IS 'Custom display unit like "per piece", "per 250g pack", etc.';