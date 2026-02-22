
-- Index for fetching properties by host (Dashboard)
CREATE INDEX IF NOT EXISTS idx_properties_host_id ON properties(host_id);

-- Index for filtering properties by city (Search)
CREATE INDEX IF NOT EXISTS idx_properties_location_city ON properties(location_city);

-- Index for filtering properties by country (Search)
CREATE INDEX IF NOT EXISTS idx_properties_location_country ON properties(location_country);

-- Index for fetching published properties (Public view)
CREATE INDEX IF NOT EXISTS idx_properties_is_published ON properties(is_published);

-- Index for bookings by user (My Trips)
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);

-- Index for bookings by property (Calendar/Availability)
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
