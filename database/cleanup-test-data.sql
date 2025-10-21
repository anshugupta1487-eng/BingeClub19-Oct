-- Clean up test data from all tables
-- This script removes all records with user_id = 'default-user'

-- Delete in the correct order to respect foreign key constraints
-- 1. Delete ratings first (they reference movies)
DELETE FROM ratings WHERE user_id = 'default-user';

-- 2. Delete movies (they reference user_profiles)
DELETE FROM movies WHERE user_id = 'default-user';

-- 3. Delete search history
DELETE FROM search_history WHERE user_id = 'default-user';

-- 4. Delete user profiles
DELETE FROM user_profiles WHERE user_id = 'default-user';

-- Verify cleanup
SELECT 'ratings' as table_name, COUNT(*) as remaining_records FROM ratings WHERE user_id = 'default-user'
UNION ALL
SELECT 'movies' as table_name, COUNT(*) as remaining_records FROM movies WHERE user_id = 'default-user'
UNION ALL
SELECT 'search_history' as table_name, COUNT(*) as remaining_records FROM search_history WHERE user_id = 'default-user'
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) as remaining_records FROM user_profiles WHERE user_id = 'default-user';

-- Show current data counts
SELECT 'ratings' as table_name, COUNT(*) as total_records FROM ratings
UNION ALL
SELECT 'movies' as table_name, COUNT(*) as total_records FROM movies
UNION ALL
SELECT 'search_history' as table_name, COUNT(*) as total_records FROM search_history
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) as total_records FROM user_profiles;
