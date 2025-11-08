-- Add column to indicate if product is sold by weight
ALTER TABLE products ADD COLUMN is_sold_by_weight boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN products.is_sold_by_weight IS 'If true, base_price represents price per 600g and customers can specify weight';

ALTER TABLE products
ADD COLUMN IF NOT EXISTS weight_tiers jsonb DEFAULT '[]'::jsonb;
