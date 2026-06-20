-- 1. Create citizens table mapping to auth.users
CREATE TABLE IF NOT EXISTS public.citizens (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    citizen_id TEXT UNIQUE,
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Sequence and Trigger for Citizen ID (CIT-UP-XXXXXX)
CREATE SEQUENCE IF NOT EXISTS public.citizen_id_seq START 1;

CREATE OR REPLACE FUNCTION public.set_citizen_id()
RETURNS trigger AS $$
BEGIN
    IF NEW.citizen_id IS NULL OR NEW.citizen_id = '' THEN
        NEW.citizen_id := 'CIT-UP-' || LPAD(nextval('public.citizen_id_seq')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_citizen_id
BEFORE INSERT ON public.citizens
FOR EACH ROW
EXECUTE FUNCTION public.set_citizen_id();

-- 3. Modify Complaints Table to link with Citizens
ALTER TABLE public.complaints
ADD COLUMN IF NOT EXISTS citizen_id UUID REFERENCES public.citizens(id) ON DELETE SET NULL;

-- 4. Create Sequence and Trigger for Complaint Number (UPP-YYYY-XXXXX)
-- We start at a higher number assuming there is existing seed data
CREATE SEQUENCE IF NOT EXISTS public.complaint_number_seq START 1500;

CREATE OR REPLACE FUNCTION public.set_complaint_number()
RETURNS trigger AS $$
BEGIN
    IF NEW.complaint_number IS NULL OR NEW.complaint_number = '' THEN
        NEW.complaint_number := 'UPP-' || to_char(now(), 'YYYY') || '-' || LPAD(nextval('public.complaint_number_seq')::text, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_complaint_number
BEFORE INSERT ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.set_complaint_number();

-- 5. Trigger to automatically create a citizen profile when a user signs up with the "Citizen" role
CREATE OR REPLACE FUNCTION public.handle_new_citizen()
RETURNS trigger AS $$
BEGIN
    IF new.raw_user_meta_data->>'role' = 'Citizen' THEN
        INSERT INTO public.citizens (id, full_name, mobile, email)
        VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'full_name', 'Citizen'),
            new.raw_user_meta_data->>'mobile',
            new.email
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created_citizen
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_citizen();

-- 6. Row Level Security for Citizens Table
ALTER TABLE public.citizens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Citizens can read their own profile" ON public.citizens
    FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Citizens can update their own profile" ON public.citizens
    FOR UPDATE TO authenticated USING (id = auth.uid());

-- 7. Update Complaint RLS for Citizens
-- Add a policy allowing citizens to read their own complaints
CREATE POLICY "Allow citizens to read their own complaints" ON public.complaints
    FOR SELECT TO authenticated USING (citizen_id = auth.uid());

-- Add a policy allowing citizens to insert their own complaints
CREATE POLICY "Allow citizens to insert their own complaints" ON public.complaints
    FOR INSERT TO authenticated WITH CHECK (citizen_id = auth.uid());
