-- Safely recreate RLS policies for the bookings table
-- Drop existing ones first to avoid conflict errors
DROP POLICY IF EXISTS "Guests can create bookings"              ON bookings;
DROP POLICY IF EXISTS "Guests can view own bookings"            ON bookings;
DROP POLICY IF EXISTS "Guests can update own bookings"         ON bookings;
DROP POLICY IF EXISTS "Owners can view bookings for their properties"   ON bookings;
DROP POLICY IF EXISTS "Owners can update bookings for their properties" ON bookings;
DROP POLICY IF EXISTS "Admins have full access to bookings"    ON bookings;

-- Guests can create bookings for themselves
CREATE POLICY "Guests can create bookings"
ON bookings FOR INSERT
WITH CHECK (auth.uid() = guest_id);

-- Guests can view their own bookings
CREATE POLICY "Guests can view own bookings"
ON bookings FOR SELECT
USING (auth.uid() = guest_id);

-- Guests can cancel their own (pending) bookings
CREATE POLICY "Guests can update own bookings"
ON bookings FOR UPDATE
USING (auth.uid() = guest_id);

-- Property owners can view bookings for their properties
CREATE POLICY "Owners can view bookings for their properties"
ON bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = bookings.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- Property owners can update bookings for their properties (confirm/cancel)
CREATE POLICY "Owners can update bookings for their properties"
ON bookings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = bookings.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- Admins have full access
CREATE POLICY "Admins have full access to bookings"
ON bookings FOR ALL
USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
