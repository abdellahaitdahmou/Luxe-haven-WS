
-- Upgrade Reviews Table for 2-Way System

-- 1. Add Review Type and Target
CREATE TYPE review_type AS ENUM ('property', 'guest');

ALTER TABLE reviews 
ADD COLUMN review_type review_type DEFAULT 'property',
ADD COLUMN reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE; -- For reviewing guests

-- 2. Add Aggregates to Parent Tables for faster reads
ALTER TABLE properties
ADD COLUMN average_rating DECIMAL(3, 2) DEFAULT 0,
ADD COLUMN review_count INT DEFAULT 0;

ALTER TABLE profiles
ADD COLUMN average_rating DECIMAL(3, 2) DEFAULT 0,
ADD COLUMN review_count INT DEFAULT 0;

-- 3. Security Policies (RLS)

-- Drop existing policies to be safe
DROP POLICY IF EXISTS "Users can read all reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON reviews;

-- READ: Public
CREATE POLICY "Users can read all reviews"
ON reviews FOR SELECT
USING (true);

-- CREATE: Authenticated users can create reviews linked to a booking
-- (Strict 1h after checkout validation handles in application layer/trigger, but we can prevent random inserts)
CREATE POLICY "Users can create reviews"
ON reviews FOR INSERT
WITH CHECK (auth.uid() = reviewer_id);

-- DELETE: ONLY Admin users
CREATE POLICY "Admins can delete reviews"
ON reviews FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Trigger to Update Averages Automatically
CREATE OR REPLACE FUNCTION update_average_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
    
    -- Update Property Rating
    IF (NEW.review_type = 'property' OR OLD.review_type = 'property') THEN
       UPDATE properties
       SET 
         average_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE property_id = COALESCE(NEW.property_id, OLD.property_id) AND review_type = 'property'),
         review_count = (SELECT COUNT(*) FROM reviews WHERE property_id = COALESCE(NEW.property_id, OLD.property_id) AND review_type = 'property')
       WHERE id = COALESCE(NEW.property_id, OLD.property_id);
    END IF;

    -- Update Guest Rating
    IF (NEW.review_type = 'guest' OR OLD.review_type = 'guest') THEN
       UPDATE profiles
       SET 
         average_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE reviewee_id = COALESCE(NEW.reviewee_id, OLD.reviewee_id) AND review_type = 'guest'),
         review_count = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = COALESCE(NEW.reviewee_id, OLD.reviewee_id) AND review_type = 'guest')
       WHERE id = COALESCE(NEW.reviewee_id, OLD.reviewee_id);
    END IF;

  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_average_rating();
