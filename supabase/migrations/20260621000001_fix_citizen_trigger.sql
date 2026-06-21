CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_district_id UUID;
    v_station_id UUID;
    v_role TEXT;
    v_district_name TEXT;
    v_station_name TEXT;
BEGIN
    -- Exit early if it is a Citizen. The handle_new_citizen trigger will take care of this.
    IF new.raw_user_meta_data->>'role' = 'Citizen' THEN
        RETURN new;
    END IF;

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
