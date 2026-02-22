-- Create Identity Documents Table
CREATE TABLE IF NOT EXISTS identity_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT CHECK (document_type IN ('passport', 'id_card')) NOT NULL,
  document_url TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE identity_documents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own documents" ON identity_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON identity_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins can update status (conceptually, though for now we might auto-verify or let user retry)
-- For now, let users update if rejected? Or just insert new ones?
-- Let's allow users to see their own.

-- Storage Bucket Setup (Attempt to create if not exists - requires permissions)
INSERT INTO storage.buckets (id, name, public)
VALUES ('private-documents', 'private-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- 1. Give users access to their own folder: private-documents/user_id/*
CREATE POLICY "Users can upload their own ID" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'private-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own ID" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'private-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
