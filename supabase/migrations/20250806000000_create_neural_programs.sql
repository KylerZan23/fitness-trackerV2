-- Create neural_programs table
CREATE TABLE neural_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  program_content JSONB NOT NULL,
  metadata JSONB DEFAULT '{}' -- For future extensibility
);

-- Create indexes for performance
CREATE INDEX idx_neural_programs_user_id ON neural_programs(user_id);
CREATE INDEX idx_neural_programs_created_at ON neural_programs(created_at DESC);

-- Row Level Security policies
ALTER TABLE neural_programs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own programs
CREATE POLICY "Users can view own programs" ON neural_programs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own programs
CREATE POLICY "Users can insert own programs" ON neural_programs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Optional: Allow users to update their own programs (for future features)
CREATE POLICY "Users can update own programs" ON neural_programs
  FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_neural_programs_updated_at
  BEFORE UPDATE ON neural_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
