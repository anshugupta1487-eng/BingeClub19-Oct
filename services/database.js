const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

class DatabaseService {
    // Save movie to database (user-specific)
    async saveMovie(movieData, userId) {
        try {
            const { data, error } = await supabase
                .from('movies')
                .insert([{
                    user_id: userId,
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
                // If movie already exists for this user, return existing record
                if (error.code === '23505') { // Unique constraint violation
                    const { data: existingMovie } = await supabase
                        .from('movies')
                        .select('*')
                        .eq('user_id', userId)
                        .eq('imdb_id', movieData.imdbID)
                        .single();
                    return { data: existingMovie, isNew: false };
                }
                throw error;
            }

            // Save ratings if they exist
            if (movieData.ratings && movieData.ratings.length > 0) {
                await this.saveRatings(data.id, userId, movieData.ratings);
            }

            return { data, isNew: true };
        } catch (error) {
            console.error('Error saving movie:', error);
            throw error;
        }
    }

    // Save ratings for a movie (user-specific)
    async saveRatings(movieId, userId, ratings) {
        try {
            const ratingsData = ratings.map(rating => ({
                movie_id: movieId,
                user_id: userId,
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

    // Get all saved movies for a user
    async getSavedMovies(userId) {
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
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching saved movies:', error);
            throw error;
        }
    }

    // Get movie by ID (user-specific)
    async getMovieById(movieId, userId) {
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
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching movie by ID:', error);
            throw error;
        }
    }

    // Delete movie from saved list (user-specific)
    async deleteMovie(movieId, userId) {
        try {
            const { error } = await supabase
                .from('movies')
                .delete()
                .eq('id', movieId)
                .eq('user_id', userId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting movie:', error);
            throw error;
        }
    }

    // Check if movie exists for user
    async movieExists(imdbId, userId) {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('id')
                .eq('imdb_id', imdbId)
                .eq('user_id', userId)
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

    // Add search history (user-specific)
    async addSearchHistory(searchQuery, userId, movieId = null) {
        try {
            const { error } = await supabase
                .from('search_history')
                .insert([{
                    user_id: userId,
                    search_query: searchQuery,
                    movie_id: movieId
                }]);

            if (error) throw error;
        } catch (error) {
            console.error('Error adding search history:', error);
            // Don't throw error for search history as it's not critical
        }
    }

    // Get search history for user
    async getSearchHistory(userId, limit = 10) {
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
                .eq('user_id', userId)
                .order('searched_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching search history:', error);
            throw error;
        }
    }

    // Create or update user profile
    async upsertUserProfile(userData) {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .upsert([{
                    user_id: userData.uid,
                    display_name: userData.name,
                    email: userData.email,
                    photo_url: userData.picture
                }], {
                    onConflict: 'user_id'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error upserting user profile:', error);
            throw error;
        }
    }

    // Get user profile
    async getUserProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // Not found error
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }
}

module.exports = new DatabaseService();
