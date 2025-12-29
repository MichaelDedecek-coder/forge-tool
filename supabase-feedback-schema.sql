-- FEEDBACK SYSTEM - DATABASE SCHEMA ADDITION
-- Run this in Supabase SQL Editor after main schema
-- December 29, 2025

-- ============================================
-- FEEDBACK TABLE
-- ============================================
-- Stores user feedback, bug reports, feature requests
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL if anonymous
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'general', 'question')),
  message TEXT NOT NULL,
  email TEXT, -- Optional, for follow-up
  page_url TEXT, -- Where they were when submitting
  user_agent TEXT, -- Browser/device info
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only view their own feedback
CREATE POLICY "Users can view their own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Anyone can insert feedback (including anonymous)
CREATE POLICY "Anyone can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

-- Create indexes for fast lookups
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_type ON feedback(feedback_type);
CREATE INDEX idx_feedback_created ON feedback(created_at DESC);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Feedback system table created successfully!';
  RAISE NOTICE '📊 Table: feedback';
  RAISE NOTICE '🔒 Row Level Security: ENABLED';
  RAISE NOTICE '📝 Policies: Users can view own feedback, anyone can submit';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready to receive user feedback!';
END $$;
