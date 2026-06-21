-- Execute this in the Supabase SQL Editor to fix the Officer Login flow

CREATE OR REPLACE FUNCTION public.get_officer_email_by_badge(badge_number text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.officers WHERE belt_number = badge_number;
$$;
