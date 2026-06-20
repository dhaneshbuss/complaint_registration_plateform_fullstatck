-- 1. Enable pgcrypto for bcrypt password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Modify execute_read_only_query to strictly enforce PostgreSQL transaction_read_only mode
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

    -- Enforce read-only transaction state at the PostgreSQL engine level
    PERFORM set_config('transaction_read_only', 'on', true);

    -- Execute query and convert the dataset into a JSON aggregated array
    EXECUTE 'SELECT COALESCE(json_agg(t), ''[]''::json) FROM (' || sql_query || ') t' INTO result;
    
    -- Reset transaction state
    PERFORM set_config('transaction_read_only', 'off', true);
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Guarantee session reset on failure to prevent locking subsequent queries
        PERFORM set_config('transaction_read_only', 'off', true);
        RAISE EXCEPTION 'SQL execution failed: %', SQLERRM;
END;
$$;

-- 3. Modify handle_new_user trigger function to be conflict-tolerant and exit early
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_district_id UUID;
    v_station_id UUID;
    v_role TEXT;
    v_district_name TEXT;
    v_station_name TEXT;
BEGIN
    -- Exit early if officer or profile already exists (e.g. during bulk migrations)
    IF EXISTS (SELECT 1 FROM public.officers WHERE id = new.id) THEN
        RETURN new;
    END IF;

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

    -- Insert into officers first (using ON CONFLICT DO NOTHING)
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
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert into profiles for backwards compatibility (using ON CONFLICT DO NOTHING)
    INSERT INTO public.profiles (id, full_name, badge_number, role, district, station)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Officer ' || SUBSTRING(new.id::text FROM 1 FOR 6)),
        COALESCE(new.raw_user_meta_data->>'badge_number', 'UP-' || FLOOR(RANDOM() * 900000 + 100000)::text),
        v_role,
        v_district_name,
        v_station_name
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Bulk Sync Existing Officers into auth.users with Hashed Passwords
-- Passwords will follow the UPP@<BadgeNumber> structure and be hashed using bcrypt
DO $$
DECLARE
    r RECORD;
    hashed_pwd TEXT;
    instance_id_val UUID;
BEGIN
    -- Get current Supabase instance ID if available, or default
    SELECT id INTO instance_id_val FROM auth.instances LIMIT 1;
    IF instance_id_val IS NULL THEN
        instance_id_val := '00000000-0000-0000-0000-000000000000';
    END IF;

    FOR r IN SELECT id, email, belt_number, name, role FROM public.officers LOOP
        -- Compute personalized bcrypt hash for UPP@<BadgeNumber>
        hashed_pwd := crypt('UPP@' || r.belt_number, gen_salt('bf', 10));
        
        -- Insert into auth.users if they don't already exist
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = r.id) THEN
            INSERT INTO auth.users (
                id,
                instance_id,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_user_meta_data,
                raw_app_meta_data,
                role,
                aud,
                created_at,
                updated_at
            ) VALUES (
                r.id,
                instance_id_val,
                r.email,
                hashed_pwd,
                now(),
                jsonb_build_object(
                    'full_name', r.name,
                    'badge_number', r.belt_number,
                    'role', CASE 
                              WHEN r.role = 'DGP' THEN 'DGP'
                              WHEN r.role = 'SSP/SP' OR r.role = 'SP' THEN 'SP'
                              WHEN r.role = 'CO' THEN 'CO'
                              ELSE 'SHO'
                            END
                ),
                '{"provider":"email","providers":["email"]}'::jsonb,
                'authenticated',
                'authenticated',
                now(),
                now()
            );
        END IF;
    END LOOP;
END;
$$;

-- 5. Re-define Helper Functions for RLS Policies based on officers table
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.officers WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_district_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT district_id FROM public.officers WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_station_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT station_id FROM public.officers WHERE id = auth.uid();
$$;

-- Secure security definer function for email lookup by badge number
CREATE OR REPLACE FUNCTION public.get_officer_email_by_badge(badge_number text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.officers WHERE belt_number = badge_number;
$$;

-- 6. Hardened Row-Level Security (RLS) Policies
-- Districts
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on districts" ON public.districts;
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.districts;
DROP POLICY IF EXISTS "Allow write for DGP" ON public.districts;

CREATE POLICY "Allow read for authenticated" ON public.districts 
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow write for DGP" ON public.districts 
    FOR ALL TO authenticated USING (public.get_my_role() = 'DGP');

-- Police Stations
ALTER TABLE public.police_stations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on police_stations" ON public.police_stations;
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.police_stations;
DROP POLICY IF EXISTS "Allow write for DGP" ON public.police_stations;

CREATE POLICY "Allow read for authenticated" ON public.police_stations 
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow write for DGP" ON public.police_stations 
    FOR ALL TO authenticated USING (public.get_my_role() = 'DGP');

-- Officers
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on officers" ON public.officers;
DROP POLICY IF EXISTS "Allow read based on hierarchy" ON public.officers;
DROP POLICY IF EXISTS "Allow write for admin/district chief" ON public.officers;

CREATE POLICY "Allow read based on hierarchy" ON public.officers 
    FOR SELECT TO authenticated USING (
        public.get_my_role() = 'DGP' OR
        (public.get_my_role() IN ('SSP/SP', 'SP', 'CO') AND district_id = public.get_my_district_id()) OR
        (station_id = public.get_my_station_id()) OR
        id = auth.uid()
    );
CREATE POLICY "Allow write for admin/district chief" ON public.officers 
    FOR ALL TO authenticated USING (
        public.get_my_role() = 'DGP' OR
        (public.get_my_role() IN ('SSP/SP', 'SP') AND district_id = public.get_my_district_id())
    );

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow read profiles based on hierarchy" ON public.profiles;
DROP POLICY IF EXISTS "Allow write profiles" ON public.profiles;

CREATE POLICY "Allow read profiles based on hierarchy" ON public.profiles 
    FOR SELECT TO authenticated USING (
        public.get_my_role() = 'DGP' OR
        (public.get_my_role() IN ('SSP/SP', 'SP', 'CO') AND district = (SELECT district_name FROM public.districts WHERE id = public.get_my_district_id())) OR
        (station = (SELECT station_name FROM public.police_stations WHERE id = public.get_my_station_id())) OR
        id = auth.uid()
    );
CREATE POLICY "Allow write profiles" ON public.profiles 
    FOR ALL TO authenticated USING (
        public.get_my_role() = 'DGP' OR
        id = auth.uid()
    );

-- Complaints
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow read complaints based on hierarchy" ON public.complaints;
DROP POLICY IF EXISTS "Allow write complaints based on hierarchy" ON public.complaints;

CREATE POLICY "Allow read complaints based on hierarchy" ON public.complaints 
    FOR SELECT TO authenticated USING (
        public.get_my_role() = 'DGP' OR
        district_id = public.get_my_district_id() OR
        station_id = public.get_my_station_id() OR
        assigned_officer_id = auth.uid() OR
        assigned_io_id = auth.uid() OR
        assigned_sho_id = auth.uid()
    );
CREATE POLICY "Allow write complaints based on hierarchy" ON public.complaints 
    FOR ALL TO authenticated USING (
        public.get_my_role() IN ('DGP', 'SSP/SP', 'SP', 'CO') OR
        (public.get_my_role() = 'SHO' AND station_id = public.get_my_station_id()) OR
        assigned_io_id = auth.uid()
    );

-- Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow insert audit logs" ON public.audit_logs;

CREATE POLICY "Allow read audit logs" ON public.audit_logs 
    FOR SELECT TO authenticated USING (
        public.get_my_role() = 'DGP' OR
        officer_id = auth.uid()
    );
CREATE POLICY "Allow insert audit logs" ON public.audit_logs 
    FOR INSERT TO authenticated WITH CHECK (
        officer_id = auth.uid()
    );

-- AI Chat History
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on ai_chat_history" ON public.ai_chat_history;
DROP POLICY IF EXISTS "Allow owner access to AI chat history" ON public.ai_chat_history;

CREATE POLICY "Allow owner access to AI chat history" ON public.ai_chat_history 
    FOR ALL TO authenticated USING (
        user_id = auth.uid()
    );

-- 7. Add Database Performance Indexes
CREATE INDEX IF NOT EXISTS idx_complaints_district_id ON public.complaints(district_id);
CREATE INDEX IF NOT EXISTS idx_complaints_station_id ON public.complaints(station_id);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_officer_id ON public.complaints(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_io_id ON public.complaints(assigned_io_id);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_sho_id ON public.complaints(assigned_sho_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON public.complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_officers_district_id ON public.officers(district_id);
CREATE INDEX IF NOT EXISTS idx_officers_station_id ON public.officers(station_id);
CREATE INDEX IF NOT EXISTS idx_officers_belt_number ON public.officers(belt_number);
CREATE INDEX IF NOT EXISTS idx_officers_role ON public.officers(role);

CREATE INDEX IF NOT EXISTS idx_police_stations_district_id ON public.police_stations(district_id);
