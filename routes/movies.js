const express = require('express');
const axios = require('axios');
const database = require('../services/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const OMDB_API_KEY = process.env.OMDB_API_KEY || '26722011';
const OMDB_BASE_URL = 'https://www.omdbapi.com/';

// GET /api/movies/search?title=... (requires authentication)
router.get('/search', authenticateToken, async (req, res) => {
    try {
        const { title } = req.query;
        const userId = req.user.uid;
        
        console.log('Search request:', { title, userId });
        
        if (!title) {
            return res.status(400).json({ 
                error: 'Title parameter is required' 
            });
        }

        // Call OMDb API
        const response = await axios.get(OMDB_BASE_URL, {
            params: {
                t: title,
                apikey: OMDB_API_KEY
            }
        });

        const data = response.data;

        if (data.Response === 'False') {
            return res.status(404).json({ 
                error: data.Error || 'Movie/TV show not found' 
            });
        }

        // Add to search history
        await database.addSearchHistory(title, userId);

        // Format the response
        const formattedData = {
            title: data.Title,
            year: data.Year,
            plot: data.Plot,
            ratings: data.Ratings || [],
            genre: data.Genre,
            director: data.Director,
            actors: data.Actors,
            imdbRating: data.imdbRating,
            imdbVotes: data.imdbVotes,
            type: data.Type,
            poster: data.Poster,
            imdbID: data.imdbID
        };

        res.json(formattedData);

    } catch (error) {
        console.error('Error fetching movie data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch movie data',
            message: error.message 
        });
    }
});

// POST /api/movies/save - Save movie to database (requires authentication)
router.post('/save', authenticateToken, async (req, res) => {
    try {
        const movieData = req.body;
        const userId = req.user.uid;
        
        console.log('Save movie request:', { 
            movieTitle: movieData.title, 
            userId, 
            imdbID: movieData.imdbID 
        });
        
        if (!movieData.title || !movieData.imdbID) {
            console.error('Missing required fields:', { 
                title: movieData.title, 
                imdbID: movieData.imdbID 
            });
            return res.status(400).json({ 
                error: 'Title and IMDB ID are required' 
            });
        }

        // Test database connection
        console.log('Testing database connection...');
        
        // Create/update user profile
        console.log('Creating/updating user profile...');
        await database.upsertUserProfile(req.user);
        console.log('User profile updated successfully');

        // Save movie
        console.log('Saving movie to database...');
        const result = await database.saveMovie(movieData, userId);
        console.log('Movie saved successfully:', result);
        
        res.json({
            success: true,
            message: result.isNew ? 'Movie saved successfully' : 'Movie already exists',
            data: result.data
        });

    } catch (error) {
        console.error('Error saving movie:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        
        res.status(500).json({ 
            error: 'Failed to save movie',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// GET /api/movies/saved - Get all saved movies (requires authentication)
router.get('/saved', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        console.log('Fetching saved movies for user:', userId);
        
        const movies = await database.getSavedMovies(userId);
        console.log('Found saved movies:', movies.length);
        
        res.json({
            success: true,
            data: movies
        });

    } catch (error) {
        console.error('Error fetching saved movies:', error);
        res.status(500).json({ 
            error: 'Failed to fetch saved movies',
            message: error.message 
        });
    }
});

// GET /api/movies/history - Get search history (requires authentication)
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const { limit = 10 } = req.query;
        const history = await database.getSearchHistory(userId, parseInt(limit));
        
        res.json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error('Error fetching search history:', error);
        res.status(500).json({ 
            error: 'Failed to fetch search history',
            message: error.message 
        });
    }
});

// DELETE /api/movies/:id - Delete movie from saved list (requires authentication)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;
        
        if (!id) {
            return res.status(400).json({ 
                error: 'Movie ID is required' 
            });
        }

        await database.deleteMovie(id, userId);
        
        res.json({
            success: true,
            message: 'Movie deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting movie:', error);
        res.status(500).json({ 
            error: 'Failed to delete movie',
            message: error.message 
        });
    }
});

// GET /api/movies/check/:imdbId - Check if movie exists in database (requires authentication)
router.get('/check/:imdbId', authenticateToken, async (req, res) => {
    try {
        const { imdbId } = req.params;
        const userId = req.user.uid;
        
        if (!imdbId) {
            return res.status(400).json({ 
                error: 'IMDB ID is required' 
            });
        }

        const exists = await database.movieExists(imdbId, userId);
        
        res.json({
            success: true,
            exists: exists
        });

    } catch (error) {
        console.error('Error checking movie existence:', error);
        res.status(500).json({ 
            error: 'Failed to check movie existence',
            message: error.message 
        });
    }
});

// GET /api/movies/health
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'Movies API',
        timestamp: new Date().toISOString()
    });
});

// GET /api/movies/debug - Debug endpoint to check configuration
router.get('/debug', (req, res) => {
    res.json({
        status: 'OK',
        environment: {
            nodeEnv: process.env.NODE_ENV,
            hasSupabaseUrl: !!process.env.SUPABASE_URL,
            hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
            hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
            hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
            hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL
        },
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
