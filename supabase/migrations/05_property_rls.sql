-- Enable RLS on properties (already enabled in schema_v2, but good to ensure)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Access (Everyone can see listed properties)
CREATE POLICY "Public can view active properties"
ON properties FOR SELECT
USING (status = 'active');

-- 2. Admin Full Access
CREATE POLICY "Admins have full access to properties"
ON properties FOR ALL
USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- 3. Owners can view/edit their OWN properties
CREATE POLICY "Owners can view own properties"
ON properties FOR SELECT
USING (
  auth.uid() = owner_id
);

CREATE POLICY "Owners can update own properties"
ON properties FOR UPDATE
USING (
  auth.uid() = owner_id
);

CREATE POLICY "Owners can delete own properties"
ON properties FOR DELETE
USING (
  auth.uid() = owner_id
);

CREATE POLICY "Owners can insert properties"
ON properties FOR INSERT
WITH CHECK (
  auth.uid() = owner_id
);
