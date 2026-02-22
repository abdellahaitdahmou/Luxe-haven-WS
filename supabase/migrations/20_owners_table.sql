-- ==========================================
-- MIGRATION 20: Owners Table & Listing Assignment
-- ==========================================

-- 1. Create the owners table
CREATE TABLE IF NOT EXISTS public.owners (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  display_name TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT owners_profile_id_unique UNIQUE (profile_id)
);

-- 2. Create the owner_properties join table (many-to-many)
CREATE TABLE IF NOT EXISTS public.owner_properties (
  owner_id    UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (owner_id, property_id)
);

-- 3. Enable RLS
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_properties ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for owners table
-- Admins can do everything
CREATE POLICY "Admins can manage owners"
  ON public.owners FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- Owners can read their own row
CREATE POLICY "Owners can view own owner record"
  ON public.owners FOR SELECT
  USING (auth.uid() = profile_id);

-- 5. RLS Policies for owner_properties
-- Admins can manage all assignments
CREATE POLICY "Admins can manage owner_properties"
  ON public.owner_properties FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- Owners can read their own assignments
CREATE POLICY "Owners can view own property assignments"
  ON public.owner_properties FOR SELECT
  USING (
    owner_id IN (
      SELECT id FROM public.owners WHERE profile_id = auth.uid()
    )
  );

-- 6. Trigger: Auto-insert into owners when a profile's role is set to 'owner'
CREATE OR REPLACE FUNCTION public.handle_owner_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When role becomes 'owner', ensure there is a row in owners
  IF NEW.role = 'owner' THEN
    INSERT INTO public.owners (profile_id, display_name)
    VALUES (NEW.id, NEW.full_name)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_role_owner ON public.profiles;

CREATE TRIGGER on_profile_role_owner
  AFTER INSERT OR UPDATE OF role
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_owner_role_change();

-- 7. Backfill: add any existing owners who already have the role
INSERT INTO public.owners (profile_id, display_name)
SELECT id, full_name
FROM public.profiles
WHERE role = 'owner'
ON CONFLICT (profile_id) DO NOTHING;

-- Reload schema cache
NOTIFY pgrst, 'reload config';
