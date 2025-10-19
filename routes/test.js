const express = require('express');
const database = require('../services/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Test endpoint to check if user can save movies
router.post('/save-movie', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const testMovie = {
            title: 'Test Movie',
            year: '2024',
            plot: 'This is a test movie',
            imdbID: 'tt1234567',
            poster: 'https://example.com/poster.jpg',
            genre: 'Action',
            director: 'Test Director',
            actors: 'Test Actor',
            imdbRating: '8.5',
            imdbVotes: '1000',
            type: 'movie',
            ratings: [
                { Source: 'IMDb', Value: '8.5/10' }
            ]
        };

        console.log('Testing movie save for user:', userId);
        
        // Test database connection
        const result = await database.saveMovie(testMovie, userId);
        
        res.json({
            success: true,
            message: 'Test movie saved successfully',
            data: result
        });
        
    } catch (error) {
        console.error('Test save error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.stack
        });
    }
});

// Test endpoint to check if user can retrieve movies
router.get('/get-movies', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        
        console.log('Testing movie retrieval for user:', userId);
        
        const movies = await database.getSavedMovies(userId);
        
        res.json({
            success: true,
            message: 'Movies retrieved successfully',
            count: movies.length,
            data: movies
        });
        
    } catch (error) {
        console.error('Test retrieval error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.stack
        });
    }
});

module.exports = router;
