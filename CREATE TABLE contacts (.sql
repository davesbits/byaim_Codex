CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT,
  message TEXT,
  preferred_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for the contact form)
CREATE POLICY "Allow anonymous inserts" ON contacts
  FOR INSERT
  WITH CHECK (true);

-- Only allow authenticated users to read (for admin)
CREATE POLICY "Allow authenticated read" ON contacts
  FOR SELECT
  USING (auth.role() = 'authenticated');