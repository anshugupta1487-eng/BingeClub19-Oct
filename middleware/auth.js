const { verifyIdToken } = require('../services/firebase');

// Middleware to verify Firebase ID token
async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'Access denied. No token provided.' 
            });
        }
        
        const idToken = authHeader.split(' ')[1];
        
        // Verify the token with Firebase
        const result = await verifyIdToken(idToken);
        
        if (!result.success) {
            return res.status(401).json({ 
                error: 'Invalid token.',
                details: result.error 
            });
        }
        
        // Add user info to request object
        req.user = result.user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ 
            error: 'Authentication failed.',
            details: error.message 
        });
    }
}

// Optional authentication middleware (doesn't fail if no token)
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const idToken = authHeader.split(' ')[1];
            const result = await verifyIdToken(idToken);
            
            if (result.success) {
                req.user = result.user;
            }
        }
        
        next();
    } catch (error) {
        console.error('Optional auth error:', error);
        // Continue without authentication
        next();
    }
}

module.exports = {
    authenticateToken,
    optionalAuth
};
