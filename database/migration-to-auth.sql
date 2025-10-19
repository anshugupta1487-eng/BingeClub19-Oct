-- Migration script to add user_id columns to existing tables
-- Run this BEFORE running schema-with-auth.sql

-- First, let's check what tables exist and their current structure
-- (This is just for reference - you can run these to see current state)

-- Add user_id column to existing movies table
ALTER TABLE movies ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- Add user_id column to existing ratings table  
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- Add user_id column to existing search_history table
ALTER TABLE search_history ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    email VARCHAR(255),
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for user_id + imdb_id in movies table
-- First, let's remove any duplicate entries if they exist
DELETE FROM movies 
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
            PARTITION BY imdb_id ORDER BY created_at
        ) as rn
        FROM movies
    ) t WHERE rn > 1
);

-- Now add the unique constraint
ALTER TABLE movies DROP CONSTRAINT IF EXISTS movies_user_id_imdb_id_key;
ALTER TABLE movies ADD CONSTRAINT movies_user_id_imdb_id_key UNIQUE(user_id, imdb_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movies_user_id ON movies(user_id);
CREATE INDEX IF NOT EXISTS idx_movies_user_imdb ON movies(user_id, imdb_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Update existing records to have a default user_id (for existing data)
-- You can change 'default-user' to any value you prefer
UPDATE movies SET user_id = 'default-user' WHERE user_id IS NULL;
UPDATE ratings SET user_id = 'default-user' WHERE user_id IS NULL;
UPDATE search_history SET user_id = 'default-user' WHERE user_id IS NULL;

-- Make user_id NOT NULL after setting default values
ALTER TABLE movies ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE ratings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE search_history ALTER COLUMN user_id SET NOT NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on movies" ON movies;
DROP POLICY IF EXISTS "Allow all operations on ratings" ON ratings;
DROP POLICY IF EXISTS "Allow all operations on search_history" ON search_history;

-- Create new RLS policies for user-specific data access
-- Movies policies
CREATE POLICY "Users can view their own movies" ON movies
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own movies" ON movies
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own movies" ON movies
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own movies" ON movies
    FOR DELETE USING (auth.uid()::text = user_id);

-- Ratings policies
CREATE POLICY "Users can view their own ratings" ON ratings
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own ratings" ON ratings
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own ratings" ON ratings
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own ratings" ON ratings
    FOR DELETE USING (auth.uid()::text = user_id);

-- Search history policies
CREATE POLICY "Users can view their own search history" ON search_history
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own search history" ON search_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own search history" ON search_history
    FOR DELETE USING (auth.uid()::text = user_id);

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_movies_updated_at ON movies;
CREATE TRIGGER update_movies_updated_at 
    BEFORE UPDATE ON movies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create a function to get user's movies with ratings
CREATE OR REPLACE FUNCTION get_user_movies_with_ratings(user_uid TEXT)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    year VARCHAR(10),
    plot TEXT,
    imdb_id VARCHAR(20),
    poster_url TEXT,
    genre VARCHAR(255),
    director VARCHAR(255),
    actors TEXT,
    imdb_rating VARCHAR(10),
    imdb_votes VARCHAR(20),
    type VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    ratings JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.year,
        m.plot,
        m.imdb_id,
        m.poster_url,
        m.genre,
        m.director,
        m.actors,
        m.imdb_rating,
        m.imdb_votes,
        m.type,
        m.created_at,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'source', r.source,
                        'value', r.value
                    )
                )
                FROM ratings r
                WHERE r.movie_id = m.id
            ),
            '[]'::jsonb
        ) as ratings
    FROM movies m
    WHERE m.user_id = user_uid
    ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
