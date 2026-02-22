-- 10_pricing_and_discounts.sql

-- Daily Prices (Overrides base price)
CREATE TABLE IF NOT EXISTS daily_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, date)
);

-- Discounts
CREATE TYPE discount_type AS ENUM ('weekly', 'monthly', 'custom', 'last_minute', 'early_bird');

CREATE TABLE IF NOT EXISTS discounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  type discount_type NOT NULL,
  value DECIMAL(10, 2) NOT NULL, -- Percentage or fixed amount? Usually percentage for weekly/monthly. Let's assume percentage for now or add a type.
  is_percentage BOOLEAN DEFAULT TRUE,
  start_date DATE, -- Optional for weekly/monthly (applies always if null)
  end_date DATE,
  min_nights INTEGER, -- For custom rules
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE daily_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Policies (Admin only for now, or Owner)
CREATE POLICY "Admins and Owners can manage pricing" ON daily_prices
  USING (
    auth.uid() IN (SELECT owner_id FROM properties WHERE id = daily_prices.property_id) 
    OR 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  )
  WITH CHECK (
    auth.uid() IN (SELECT owner_id FROM properties WHERE id = daily_prices.property_id) 
    OR 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

CREATE POLICY "everyone can view pricing" ON daily_prices FOR SELECT USING (true);


CREATE POLICY "Admins and Owners can manage discounts" ON discounts
  USING (
    auth.uid() IN (SELECT owner_id FROM properties WHERE id = discounts.property_id) 
    OR 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  )
  WITH CHECK (
    auth.uid() IN (SELECT owner_id FROM properties WHERE id = discounts.property_id) 
    OR 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

CREATE POLICY "everyone can view discounts" ON discounts FOR SELECT USING (true);
