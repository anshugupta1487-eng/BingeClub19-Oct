const express = require('express');
const axios = require('axios');
const { database } = require('../services/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Health check (no authentication required)
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Movies API is healthy',
        timestamp: new Date().toISOString()
    });
});

// Apply authentication to all other movie routes
router.use(authenticateToken);

// Search for movies
router.get('/search', async (req, res) => {
    try {
        const { title } = req.query;
        
        if (!title) {
            return res.status(400).json({ error: 'Title parameter is required' });
        }

        const OMDB_API_KEY = process.env.OMDB_API_KEY;
        if (!OMDB_API_KEY) {
            return res.status(500).json({ error: 'OMDb API key not configured' });
        }

        const response = await axios.get(`https://www.omdbapi.com/`, {
            params: {
                t: title,
                apikey: OMDB_API_KEY
            }
        });

        if (response.data.Response === 'False') {
            return res.status(404).json({ error: response.data.Error });
        }

        // Save search history
        await database.saveSearchHistory(title, req.user.uid);

        res.json(response.data);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Failed to search for movie' });
    }
});

// Save movie
router.post('/save', async (req, res) => {
    try {
        const movieData = req.body;
        const userId = req.user.uid;
        
        // Get user data from the token (if available)
        const userData = {
            displayName: req.user.name,
            email: req.user.email,
            photoURL: req.user.picture
        };

        console.log('Saving movie for user:', userId);
        console.log('User data:', userData);
        console.log('Movie data:', movieData);

        const result = await database.saveMovie(movieData, userId, userData);
        
        res.json({
            success: true,
            message: 'Movie saved successfully',
            data: result
        });
    } catch (error) {
        console.error('Save movie error:', error);
        res.status(500).json({ 
            error: 'Failed to save movie',
            message: error.message 
        });
    }
});

// Get saved movies
router.get('/saved', async (req, res) => {
    try {
        const userId = req.user.uid;
        const movies = await database.getSavedMovies(userId);
        
        res.json({
            success: true,
            data: movies
        });
    } catch (error) {
        console.error('Get saved movies error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve saved movies',
            message: error.message 
        });
    }
});

// Delete movie
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;
        
        await database.deleteMovie(id, userId);
        
        res.json({
            success: true,
            message: 'Movie deleted successfully'
        });
    } catch (error) {
        console.error('Delete movie error:', error);
        res.status(500).json({ 
            error: 'Failed to delete movie',
            message: error.message 
        });
    }
});

// Check if movie exists
router.get('/check/:imdbId', async (req, res) => {
    try {
        const { imdbId } = req.params;
        const userId = req.user.uid;
        
        const result = await database.checkMovieExists(imdbId, userId);
        
        res.json({
            success: true,
            exists: result.exists
        });
    } catch (error) {
        console.error('Check movie error:', error);
        res.status(500).json({ 
            error: 'Failed to check movie',
            message: error.message 
        });
    }
});

module.exports = router;
