-- Fix imdb_id unique constraint to allow multiple users to save the same movie
-- This script removes the single-column unique constraint on imdb_id
-- and ensures only the composite unique constraint (user_id, imdb_id) exists

-- Check current constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'movies'::regclass 
AND conname LIKE '%imdb%';

-- Drop the single-column unique constraint on imdb_id if it exists
-- (This allows multiple users to save the same movie)
ALTER TABLE movies DROP CONSTRAINT IF EXISTS movies_imdb_id_key;

-- Ensure the composite unique constraint exists (user_id, imdb_id)
-- This prevents the same user from saving the same movie twice
ALTER TABLE movies DROP CONSTRAINT IF EXISTS movies_user_id_imdb_id_key;
ALTER TABLE movies ADD CONSTRAINT movies_user_id_imdb_id_key UNIQUE(user_id, imdb_id);

-- Verify the constraints after the change
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'movies'::regclass 
AND conname LIKE '%imdb%';

-- Test: Show that different users can have the same imdb_id
SELECT 
    user_id, 
    imdb_id, 
    title, 
    COUNT(*) as count
FROM movies 
GROUP BY user_id, imdb_id, title
ORDER BY imdb_id, user_id;
