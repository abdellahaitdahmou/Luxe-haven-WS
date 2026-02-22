-- LUXE HAVEN COMPREHENSIVE SCHEMA V2
-- Covers: Admin/Owner/Guest Roles, Listings, Bookings, Reviews, Messages, Financials

-- 1. ENUMS & TYPES
CREATE TYPE user_role AS ENUM ('admin', 'owner', 'guest', 'manager');
CREATE TYPE listing_status AS ENUM ('draft', 'pending_approval', 'active', 'rejected', 'archived');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'disputed');
CREATE TYPE cancellation_policy_type AS ENUM ('flexible', 'moderate', 'strict');

-- 2. PROFILES (Users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role DEFAULT 'guest',
  full_name TEXT,
  avatar_url TEXT,
  email TEXT, -- Synced from auth for easier queries
  phone_number TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  commission_rate DECIMAL(5,2) DEFAULT 3.00, -- Custom fee % for this owner (e.g. 3%)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROPERTIES (Listings)
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_per_night DECIMAL(10, 2) NOT NULL,
  location GEOGRAPHY(POINT), 
  address TEXT,
  city TEXT,
  country TEXT,
  amenities JSONB DEFAULT '{"wifi": true, "pool": false}'::jsonb,
  images JSONB DEFAULT '[]'::jsonb, -- New structured image data with categories
  image_urls TEXT[] DEFAULT '{}',
  max_guests INT DEFAULT 2,
  bedrooms INT DEFAULT 1,
  bathrooms INT DEFAULT 1,
  status listing_status DEFAULT 'pending_approval', -- Requires Admin approval
  cancellation_policy cancellation_policy_type DEFAULT 'moderate',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BOOKINGS
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status booking_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (check_out_date > check_in_date)
);

-- 5. REVIEWS (New Feature)
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TRANSACTIONS & FINANCIALS
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL, -- Total paid by guest
  platform_fee DECIMAL(10, 2) NOT NULL, -- Revenue for Luxe Haven
  owner_payout DECIMAL(10, 2) NOT NULL, -- Amount for Owner
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'succeeded',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MESSAGING
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ADMIN SETTINGS (For dynamic fees)
CREATE TABLE admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Example: INSERT INTO admin_settings (key, value) VALUES ('global_platform_fee_percent', '10');

-- 9. SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- (Add policies here)
