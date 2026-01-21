-- Billing related columns for profiles table
-- Run this migration in Supabase SQL Editor

-- Add billing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 10;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS storage_used BIGINT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_id ON profiles(subscription_id);

-- Function to deduct credits atomically
CREATE OR REPLACE FUNCTION deduct_credits(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET credits = credits - amount
  WHERE id = user_id AND credits >= amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to add credits atomically
CREATE OR REPLACE FUNCTION add_credits(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET credits = credits + amount
  WHERE id = user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION add_credits(UUID, INTEGER) TO authenticated;
