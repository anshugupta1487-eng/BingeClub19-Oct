-- Check current table structure
-- Run this first to see what columns exist in your tables

-- Check movies table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'movies' 
ORDER BY ordinal_position;

-- Check ratings table structure  
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ratings' 
ORDER BY ordinal_position;

-- Check search_history table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'search_history' 
ORDER BY ordinal_position;

-- Check if user_profiles table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'user_profiles';

-- Check existing data in movies table (first 5 rows)
SELECT id, title, year, imdb_id, created_at 
FROM movies 
LIMIT 5;
