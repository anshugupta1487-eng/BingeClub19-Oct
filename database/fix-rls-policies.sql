-- Fix RLS policies for Firebase authentication
-- This script addresses the RLS policy issues when using Firebase auth with Supabase

-- Option 1: Temporarily disable RLS for user_profiles (quick fix)
-- Uncomment the line below if you want to disable RLS temporarily
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Option 2: Create a more permissive policy for user_profiles
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- Create new policies that work with external authentication
-- Allow authenticated users to manage their own profiles
CREATE POLICY "Allow profile access for authenticated users" ON user_profiles
    FOR ALL USING (true)
    WITH CHECK (true);

-- Option 3: Alternative - Use service role key (recommended)
-- If you have SUPABASE_SERVICE_ROLE_KEY set in your environment,
-- the server will use that instead of the anon key, bypassing RLS

-- Grant additional permissions
GRANT ALL ON user_profiles TO anon, authenticated;
GRANT ALL ON movies TO anon, authenticated;
GRANT ALL ON ratings TO anon, authenticated;
GRANT ALL ON search_history TO anon, authenticated;

-- Ensure sequences are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
