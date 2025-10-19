-- Binge Club Database Schema for Supabase
-- Run these commands in your Supabase SQL editor

-- Create movies table
CREATE TABLE IF NOT EXISTS movies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    year VARCHAR(10),
    plot TEXT,
    imdb_id VARCHAR(20) UNIQUE,
    poster_url TEXT,
    genre VARCHAR(255),
    director VARCHAR(255),
    actors TEXT,
    imdb_rating VARCHAR(10),
    imdb_votes VARCHAR(20),
    type VARCHAR(20), -- 'movie' or 'series'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ratings table (normalized for better data structure)
CREATE TABLE IF NOT EXISTS ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
    source VARCHAR(100) NOT NULL, -- 'IMDb', 'Rotten Tomatoes', etc.
    value VARCHAR(20) NOT NULL,   -- '8.5/10', '85%', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search history table
CREATE TABLE IF NOT EXISTS search_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    search_query VARCHAR(255) NOT NULL,
    movie_id UUID REFERENCES movies(id),
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movies_imdb_id ON movies(imdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_movies_created_at ON movies(created_at);
CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings(movie_id);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at);

-- Enable Row Level Security (RLS)
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your use case)
-- For now, allowing all operations for simplicity
-- In production, you might want to restrict based on user authentication

-- Movies policies
CREATE POLICY "Allow all operations on movies" ON movies
    FOR ALL USING (true) WITH CHECK (true);

-- Ratings policies
CREATE POLICY "Allow all operations on ratings" ON ratings
    FOR ALL USING (true) WITH CHECK (true);

-- Search history policies
CREATE POLICY "Allow all operations on search_history" ON search_history
    FOR ALL USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_movies_updated_at 
    BEFORE UPDATE ON movies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional)
-- INSERT INTO movies (title, year, plot, imdb_id, type) VALUES
-- ('The Shawshank Redemption', '1994', 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.', 'tt0111161', 'movie'),
-- ('The Godfather', '1972', 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.', 'tt0068646', 'movie');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
