-- Add parent_id column for subcategory support and has_egg_option for filtering
ALTER TABLE public.categories 
ADD COLUMN parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
ADD COLUMN has_egg_option boolean DEFAULT false;

-- Create index for faster subcategory queries
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

-- Update existing Cakes category to support egg option if it exists
UPDATE public.categories SET has_egg_option = true WHERE name ILIKE '%cake%';