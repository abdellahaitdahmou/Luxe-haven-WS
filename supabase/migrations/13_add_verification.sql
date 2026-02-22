-- Add verification columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified', -- unverified, pending, verified
ADD COLUMN IF NOT EXISTS id_document_url TEXT;

-- Create storage bucket for verification docs if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification_docs', 'verification_docs', false) 
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Users can upload their own ID
CREATE POLICY "Users can upload their own verification docs"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'verification_docs' AND 
    auth.uid() = owner
);

-- Storage Policy: Users can read their own ID
CREATE POLICY "Users can read their own verification docs"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'verification_docs' AND 
    auth.uid() = owner
);
