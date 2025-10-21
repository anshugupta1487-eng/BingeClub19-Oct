const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

// Use service role key for server-side operations to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Database service functions
class DatabaseService {
    // Ensure user profile exists
    async ensureUserProfile(userId, userData = {}) {
        try {
            // Check if user profile exists
            const { data: existingProfile, error: checkError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
                throw checkError;
            }

            // If profile doesn't exist, create it
            if (!existingProfile) {
                const { data: newProfile, error: createError } = await supabase
                    .from('user_profiles')
                    .insert([{
                        user_id: userId,
                        display_name: userData.displayName || userData.name || 'User',
                        email: userData.email || '',
                        photo_url: userData.photoURL || userData.photoUrl || ''
                    }])
                    .select()
                    .single();

                if (createError) {
                    console.error('Error creating user profile:', createError);
                    throw createError;
                }

                console.log('User profile created:', newProfile);
                return newProfile;
            }

            return existingProfile;
        } catch (error) {
            console.error('Error ensuring user profile:', error);
            throw error;
        }
    }

    // Save movie with user profile check
    async saveMovie(movieData, userId, userData = {}) {
        try {
            // Ensure user profile exists first
            await this.ensureUserProfile(userId, userData);

            // Check if movie already exists for this user
            const { data: existingMovie, error: checkError } = await supabase
                .from('movies')
                .select('id')
                .eq('user_id', userId)
                .eq('imdb_id', movieData.imdbID)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (existingMovie) {
                throw new Error('Movie already exists in your list');
            }

            // Prepare movie data - map OMDb API fields to database fields
            const movieRecord = {
                title: movieData.Title || movieData.title,
                year: movieData.Year || movieData.year,
                plot: movieData.Plot || movieData.plot,
                imdb_id: movieData.imdbID || movieData.imdbId,
                poster_url: movieData.Poster || movieData.poster,
                genre: movieData.Genre || movieData.genre,
                director: movieData.Director || movieData.director,
                actors: movieData.Actors || movieData.actors,
                imdb_rating: movieData.imdbRating || movieData.ImdbRating,
                imdb_votes: movieData.imdbVotes || movieData.ImdbVotes,
                type: movieData.Type || movieData.type,
                user_id: userId
            };

            // Insert movie
            const { data: movie, error: movieError } = await supabase
                .from('movies')
                .insert([movieRecord])
                .select()
                .single();

            if (movieError) {
                console.error('Error saving movie:', movieError);
                throw movieError;
            }

            // Save ratings if they exist - handle both OMDb and internal formats
            const ratings = movieData.Ratings || movieData.ratings;
            if (ratings && ratings.length > 0) {
                const ratingRecords = ratings.map(rating => ({
                    movie_id: movie.id,
                    source: rating.Source,
                    value: rating.Value,
                    user_id: userId
                }));

                const { error: ratingsError } = await supabase
                    .from('ratings')
                    .insert(ratingRecords);

                if (ratingsError) {
                    console.error('Error saving ratings:', ratingsError);
                    // Don't throw here, movie was saved successfully
                }
            }

            return movie;
        } catch (error) {
            console.error('Database save error:', error);
            throw error;
        }
    }

    // Get saved movies for user
    async getSavedMovies(userId) {
        try {
            const { data: movies, error } = await supabase
                .from('movies')
                .select(`
                    id,
                    title,
                    year,
                    plot,
                    imdb_id,
                    poster_url,
                    genre,
                    director,
                    actors,
                    imdb_rating,
                    imdb_votes,
                    type,
                    created_at,
                    ratings (
                        source,
                        value
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching saved movies:', error);
                throw error;
            }

            return movies || [];
        } catch (error) {
            console.error('Database fetch error:', error);
            throw error;
        }
    }

    // Delete movie
    async deleteMovie(movieId, userId) {
        try {
            // First delete ratings
            const { error: ratingsError } = await supabase
                .from('ratings')
                .delete()
                .eq('movie_id', movieId)
                .eq('user_id', userId);

            if (ratingsError) {
                console.error('Error deleting ratings:', ratingsError);
            }

            // Then delete movie
            const { error: movieError } = await supabase
                .from('movies')
                .delete()
                .eq('id', movieId)
                .eq('user_id', userId);

            if (movieError) {
                console.error('Error deleting movie:', movieError);
                throw movieError;
            }

            return { success: true };
        } catch (error) {
            console.error('Database delete error:', error);
            throw error;
        }
    }

    // Check if movie exists
    async checkMovieExists(imdbId, userId) {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('id')
                .eq('user_id', userId)
                .eq('imdb_id', imdbId)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            return { exists: !!data };
        } catch (error) {
            console.error('Database check error:', error);
            throw error;
        }
    }

    // Save search history
    async saveSearchHistory(query, userId) {
        try {
            const { error } = await supabase
                .from('search_history')
                .insert([{
                    query,
                    user_id: userId
                }]);

            if (error) {
                console.error('Error saving search history:', error);
                // Don't throw, this is not critical
            }
        } catch (error) {
            console.error('Database search history error:', error);
            // Don't throw, this is not critical
        }
    }
}

module.exports = {
    supabase,
    database: new DatabaseService()
};
