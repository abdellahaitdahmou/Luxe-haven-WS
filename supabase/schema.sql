-- Enable necessary extensions
-- Note: You might need to enable PostGIS in the Supabase Dashboard Extensions page if this fails.
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Profiles Table (Extends Auth)
CREATE TYPE user_role AS ENUM ('admin', 'owner', 'guest');

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role DEFAULT 'guest',
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Properties Table
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_per_night DECIMAL(10, 2) NOT NULL,
  location GEOGRAPHY(POINT) NOT NULL, -- Requires PostGIS
  address TEXT,
  amenities JSONB DEFAULT '{}'::jsonb, -- Flexible amenities list
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bookings Table
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

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

-- 4. Transactions Table (Financials)
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL, -- Total amount paid by guest
  service_fee DECIMAL(10, 2) NOT NULL, -- Platform fee
  owner_payout DECIMAL(10, 2) NOT NULL, -- Amount sent to owner
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'succeeded',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Conversations & Messages (Real-time Chat)
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Calendar Availability & Seasonal Pricing
CREATE TABLE calendar_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  price DECIMAL(10, 2), -- Optional override price for this specific date
  is_blocked BOOLEAN DEFAULT FALSE, -- If true, date is unavailable
  data JSONB DEFAULT '{}'::jsonb, -- Extra metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, date)
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_availability ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Examples - Require iteration based on exact needs)

-- Profiles: Public read, Self update
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Properties: Public read, Owner update
CREATE POLICY "Properties are viewable by everyone." ON properties FOR SELECT USING (true);
CREATE POLICY "Owners can insert properties." ON properties FOR INSERT WITH CHECK (auth.uid() = owner_id); -- Need to check if role is owner using a function or trigger
CREATE POLICY "Owners can update own properties." ON properties FOR UPDATE USING (auth.uid() = owner_id);

-- Bookings: Guest can see own, Owner can see bookings for their properties
CREATE POLICY "Guests see own bookings." ON bookings FOR SELECT USING (auth.uid() = guest_id);
-- (Complex policy for owners seeing bookings on their properties needed)

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
