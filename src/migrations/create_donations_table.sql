-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donator_id UUID NOT NULL REFERENCES donators(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by TEXT
);

-- Create index for querying donations by date
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);

-- Create index for querying donations by creator
CREATE INDEX IF NOT EXISTS idx_donations_created_by ON donations(created_by);

-- Create index for querying donations by donator
CREATE INDEX IF NOT EXISTS idx_donations_donator_id ON donations(donator_id);

-- Add RLS policies
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own donations
CREATE POLICY select_own_donations ON donations
  FOR SELECT USING (created_by = auth.uid());

-- Policy to allow users to insert their own donations
CREATE POLICY insert_own_donations ON donations
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Policy to allow users to update their own donations
CREATE POLICY update_own_donations ON donations
  FOR UPDATE USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Policy to allow users to delete their own donations
CREATE POLICY delete_own_donations ON donations
  FOR DELETE USING (created_by = auth.uid()); 