const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

class DatabaseService {
    // Save movie to database
    async saveMovie(movieData) {
        try {
            const { data, error } = await supabase
                .from('movies')
                .insert([{
                    title: movieData.title,
                    year: movieData.year,
                    plot: movieData.plot,
                    imdb_id: movieData.imdbID,
                    poster_url: movieData.poster,
                    genre: movieData.genre,
                    director: movieData.director,
                    actors: movieData.actors,
                    imdb_rating: movieData.imdbRating,
                    imdb_votes: movieData.imdbVotes,
                    type: movieData.type
                }])
                .select()
                .single();

            if (error) {
                // If movie already exists, return existing record
                if (error.code === '23505') { // Unique constraint violation
                    const { data: existingMovie } = await supabase
                        .from('movies')
                        .select('*')
                        .eq('imdb_id', movieData.imdbID)
                        .single();
                    return { data: existingMovie, isNew: false };
                }
                throw error;
            }

            // Save ratings if they exist
            if (movieData.ratings && movieData.ratings.length > 0) {
                await this.saveRatings(data.id, movieData.ratings);
            }

            return { data, isNew: true };
        } catch (error) {
            console.error('Error saving movie:', error);
            throw error;
        }
    }

    // Save ratings for a movie
    async saveRatings(movieId, ratings) {
        try {
            const ratingsData = ratings.map(rating => ({
                movie_id: movieId,
                source: rating.Source,
                value: rating.Value
            }));

            const { error } = await supabase
                .from('ratings')
                .insert(ratingsData);

            if (error) throw error;
        } catch (error) {
            console.error('Error saving ratings:', error);
            throw error;
        }
    }

    // Get all saved movies
    async getSavedMovies() {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select(`
                    *,
                    ratings (
                        source,
                        value
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching saved movies:', error);
            throw error;
        }
    }

    // Get movie by ID
    async getMovieById(movieId) {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select(`
                    *,
                    ratings (
                        source,
                        value
                    )
                `)
                .eq('id', movieId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching movie by ID:', error);
            throw error;
        }
    }

    // Delete movie from saved list
    async deleteMovie(movieId) {
        try {
            const { error } = await supabase
                .from('movies')
                .delete()
                .eq('id', movieId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting movie:', error);
            throw error;
        }
    }

    // Check if movie exists
    async movieExists(imdbId) {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('id')
                .eq('imdb_id', imdbId)
                .single();

            if (error && error.code !== 'PGRST116') { // Not found error
                throw error;
            }

            return !!data;
        } catch (error) {
            console.error('Error checking movie existence:', error);
            throw error;
        }
    }

    // Add search history
    async addSearchHistory(searchQuery, movieId = null) {
        try {
            const { error } = await supabase
                .from('search_history')
                .insert([{
                    search_query: searchQuery,
                    movie_id: movieId
                }]);

            if (error) throw error;
        } catch (error) {
            console.error('Error adding search history:', error);
            // Don't throw error for search history as it's not critical
        }
    }

    // Get search history
    async getSearchHistory(limit = 10) {
        try {
            const { data, error } = await supabase
                .from('search_history')
                .select(`
                    *,
                    movies (
                        title,
                        year,
                        poster_url
                    )
                `)
                .order('searched_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching search history:', error);
            throw error;
        }
    }
}

module.exports = new DatabaseService();
