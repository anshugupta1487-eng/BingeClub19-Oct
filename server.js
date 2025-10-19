const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const movieRoutes = require('./routes/movies');
const debugRoutes = require('./routes/debug');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration for Render
const corsOptions = {
    origin: [
        'https://bingeclub19-oct.onrender.com', // Your Render URL
        'http://localhost:3000' // For local development
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/movies', movieRoutes);
app.use('/api/debug', debugRoutes);

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Binge Club API is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🎬 Binge Club server running on port ${PORT}`);
    console.log(`🌐 Visit: http://localhost:${PORT}`);
    console.log(`🔧 Debug endpoints available at /api/debug`);
});

module.exports = app;
