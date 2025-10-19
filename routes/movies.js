const express = require('express');
const axios = require('axios');
const router = express.Router();

const OMDB_API_KEY = process.env.OMDB_API_KEY || '26722011';
const OMDB_BASE_URL = 'https://www.omdbapi.com/';

// GET /api/movies/search?title=...
router.get('/search', async (req, res) => {
    try {
        const { title } = req.query;
        
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
            poster: data.Poster
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

// GET /api/movies/health
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'Movies API',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
