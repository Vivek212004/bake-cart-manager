-- Add delivery_person to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'delivery_person';