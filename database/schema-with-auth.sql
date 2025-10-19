-- Binge Club Database Schema with Authentication for Supabase
-- Run these commands in your Supabase SQL editor

-- Create movies table (now user-specific)
CREATE TABLE IF NOT EXISTS movies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- Firebase UID
    title VARCHAR(255) NOT NULL,
    year VARCHAR(10),
    plot TEXT,
    imdb_id VARCHAR(20) NOT NULL,
    poster_url TEXT,
    genre VARCHAR(255),
    director VARCHAR(255),
    actors TEXT,
    imdb_rating VARCHAR(10),
    imdb_votes VARCHAR(20),
    type VARCHAR(20), -- 'movie' or 'series'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, imdb_id) -- Prevent duplicate movies per user
);

-- Create ratings table (user-specific)
CREATE TABLE IF NOT EXISTS ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL, -- Firebase UID
    source VARCHAR(100) NOT NULL, -- 'IMDb', 'Rotten Tomatoes', etc.
    value VARCHAR(20) NOT NULL,   -- '8.5/10', '85%', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search history table (user-specific)
CREATE TABLE IF NOT EXISTS search_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- Firebase UID
    search_query VARCHAR(255) NOT NULL,
    movie_id UUID REFERENCES movies(id),
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user profiles table (optional - for additional user data)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL, -- Firebase UID
    display_name VARCHAR(255),
    email VARCHAR(255),
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movies_user_id ON movies(user_id);
CREATE INDEX IF NOT EXISTS idx_movies_imdb_id ON movies(imdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_user_imdb ON movies(user_id, imdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_created_at ON movies(created_at);
CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings(movie_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user-specific data access
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
CREATE TRIGGER update_movies_updated_at 
    BEFORE UPDATE ON movies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
