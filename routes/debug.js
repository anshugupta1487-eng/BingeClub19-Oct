const express = require('express');
const database = require('../services/database');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Test database connection
router.get('/database', async (req, res) => {
    try {
        console.log('Testing database connection...');
        
        // Test Supabase connection
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            return res.status(500).json({
                error: 'Missing Supabase environment variables',
                hasUrl: !!supabaseUrl,
                hasKey: !!supabaseKey
            });
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Test basic connection
        const { data, error } = await supabase
            .from('movies')
            .select('count')
            .limit(1);
            
        if (error) {
            console.error('Database connection error:', error);
            return res.status(500).json({
                error: 'Database connection failed',
                message: error.message,
                code: error.code
            });
        }
        
        res.json({
            status: 'OK',
            message: 'Database connection successful',
            supabaseUrl: supabaseUrl.substring(0, 30) + '...',
            hasKey: !!supabaseKey,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Debug database error:', error);
        res.status(500).json({
            error: 'Database test failed',
            message: error.message,
            stack: error.stack
        });
    }
});

// Test environment variables
router.get('/env', (req, res) => {
    res.json({
        status: 'OK',
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'Missing',
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'Set' : 'Missing',
            FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
            FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Missing',
            FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Missing',
            OMDB_API_KEY: process.env.OMDB_API_KEY ? 'Set' : 'Missing'
        },
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
