-- Fix security definer view issue by explicitly setting SECURITY INVOKER
CREATE OR REPLACE VIEW public.product_ratings 
WITH (security_invoker=true) AS
SELECT 
  product_id,
  COUNT(*) as review_count,
  ROUND(AVG(rating)::numeric, 1) as average_rating
FROM public.product_reviews
GROUP BY product_id;