-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean up existing tables, triggers, and policies to allow a clean reinstall
-- Clean up existing tables, triggers, and policies to allow a clean reinstall
DROP TABLE IF EXISTS public.ai_chat_history CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.complaints CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.officers CASCADE;
DROP TABLE IF EXISTS public.police_stations CASCADE;
DROP TABLE IF EXISTS public.districts CASCADE;

-- 1. Create districts Table
CREATE TABLE IF NOT EXISTS public.districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_name TEXT NOT NULL UNIQUE,
    range_name TEXT NOT NULL,
    zone_name TEXT NOT NULL
);

-- Enable RLS on districts
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read/write on districts" ON public.districts FOR ALL USING (true);

-- 2. Create police_stations Table
CREATE TABLE IF NOT EXISTS public.police_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID REFERENCES public.districts(id) ON DELETE CASCADE,
    station_name TEXT NOT NULL,
    station_code TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    UNIQUE (district_id, station_name)
);

-- Enable RLS on police_stations
ALTER TABLE public.police_stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read/write on police_stations" ON public.police_stations FOR ALL USING (true);

-- 3. Create officers Table
CREATE TABLE IF NOT EXISTS public.officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rank TEXT NOT NULL,
    belt_number TEXT NOT NULL UNIQUE,
    mobile TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
    station_id UUID REFERENCES public.police_stations(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('DGP', 'ADG', 'IG', 'DIG', 'SSP/SP', 'ASP', 'CO', 'SHO', 'SI', 'IO', 'Constable')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Retired', 'On Leave'))
);

-- Enable RLS on officers
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read/write on officers" ON public.officers FOR ALL USING (true);

-- 4. Create Profiles Table (Officers profile mapping for backwards compatibility and auth logins)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES public.officers(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    badge_number TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('SHO', 'CO', 'SP', 'DGP')),
    district TEXT NOT NULL,
    station TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read/write on profiles" ON public.profiles FOR ALL USING (true);

-- 5. Create Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    complaint_number TEXT NOT NULL UNIQUE,
    complainant_name TEXT NOT NULL,
    complainant_phone TEXT NOT NULL,
    complainant_email TEXT,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Cyber Crime', 'Women Safety', 'Child Safety', 'Land Dispute', 'Financial Fraud', 'Law & Order', 'Missing Person', 'Domestic Violence')),
    ai_predicted_category TEXT,
    ai_severity_score INT CHECK (ai_severity_score BETWEEN 1 AND 10),
    ai_recommended_action TEXT,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Under Investigation', 'In Progress', 'Resolved', 'Escalated', 'Closed')),
    -- Kept for compatibility
    district TEXT NOT NULL,
    station TEXT NOT NULL,
    assigned_officer_id UUID REFERENCES public.officers(id) ON DELETE SET NULL,
    -- New relational links
    district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
    station_id UUID REFERENCES public.police_stations(id) ON DELETE SET NULL,
    assigned_sho_id UUID REFERENCES public.officers(id) ON DELETE SET NULL,
    assigned_io_id UUID REFERENCES public.officers(id) ON DELETE SET NULL,
    
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Complaints
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read/write on complaints" ON public.complaints FOR ALL USING (true);

-- 6. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read/write on audit_logs" ON public.audit_logs FOR ALL USING (true);

-- 7. Create AI Chat History Table
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on AI Chat History
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read/write on ai_chat_history" ON public.ai_chat_history FOR ALL USING (true);


-- ----------------------------------------------------
-- Helper Functions & Triggers
-- ----------------------------------------------------

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    new.updated_at = timezone('utc'::text, now());
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to create profile when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_district_id UUID;
    v_station_id UUID;
    v_role TEXT;
    v_district_name TEXT;
    v_station_name TEXT;
BEGIN
    v_role := COALESCE(new.raw_user_meta_data->>'role', 'SHO');
    v_district_name := COALESCE(new.raw_user_meta_data->>'district', 'Lucknow');
    v_station_name := COALESCE(new.raw_user_meta_data->>'station', 'Hazratganj');

    -- Find district and station if they exist, or use defaults/first found
    SELECT id INTO v_district_id FROM public.districts WHERE district_name = v_district_name LIMIT 1;
    IF v_district_id IS NULL THEN
        SELECT id INTO v_district_id FROM public.districts LIMIT 1;
    END IF;

    SELECT id INTO v_station_id FROM public.police_stations WHERE station_name = v_station_name AND district_id = v_district_id LIMIT 1;
    IF v_station_id IS NULL AND v_district_id IS NOT NULL THEN
        SELECT id INTO v_station_id FROM public.police_stations WHERE district_id = v_district_id LIMIT 1;
    END IF;

    -- Insert into officers first
    INSERT INTO public.officers (id, name, rank, belt_number, mobile, email, district_id, station_id, role, status)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Officer ' || SUBSTRING(new.id::text FROM 1 FOR 6)),
        CASE 
            WHEN v_role = 'SHO' THEN 'Inspector'
            WHEN v_role = 'CO' THEN 'CO / Circle Officer (DSP)'
            WHEN v_role = 'SP' THEN 'SP / Superintendent'
            WHEN v_role = 'DGP' THEN 'DGP / Director General'
            ELSE 'Sub-Inspector'
        END,
        COALESCE(new.raw_user_meta_data->>'badge_number', 'UP-' || FLOOR(RANDOM() * 900000 + 100000)::text),
        '9' || FLOOR(RANDOM() * 900000000 + 100000000)::text,
        COALESCE(new.raw_user_meta_data->>'email', 'officer.' || SUBSTRING(new.id::text FROM 1 FOR 6) || '@uppolice.gov.in'),
        v_district_id,
        v_station_id,
        v_role,
        'Active'
    );

    -- Insert into profiles for backwards compatibility
    INSERT INTO public.profiles (id, full_name, badge_number, role, district, station)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Officer ' || SUBSTRING(new.id::text FROM 1 FOR 6)),
        COALESCE(new.raw_user_meta_data->>'badge_number', 'UP-' || FLOOR(RANDOM() * 900000 + 100000)::text),
        v_role,
        v_district_name,
        v_station_name
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ----------------------------------------------------
-- Helper Functions to prevent RLS Infinite Recursion
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_district()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT district FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_station()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT station FROM public.profiles WHERE id = auth.uid();
$$;


-- ----------------------------------------------------
-- Secure Dynamic SQL Execution Function for AI Chatbot
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.execute_read_only_query(sql_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Strict regex validation to block state-modifying SQL actions
    IF sql_query ~* '\m(insert|update|delete|drop|truncate|alter|create|grant|revoke|comment|vacuum|analyze|copy)\M' THEN
        RAISE EXCEPTION 'Query violates security policy: Only SELECT read-only queries are allowed.';
    END IF;

    -- Execute query and convert the dataset into a JSON aggregated array
    EXECUTE 'SELECT COALESCE(json_agg(t), ''[]''::json) FROM (' || sql_query || ') t' INTO result;
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'SQL execution failed: %', SQLERRM;
END;
$$;
