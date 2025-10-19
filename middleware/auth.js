const { verifyIdToken } = require('../services/firebase');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        console.log('Verifying token for user...');
        
        // Verify the Firebase ID token
        const decodedToken = await verifyIdToken(token);
        
        console.log('Token verified successfully for user:', decodedToken.uid);
        console.log('User data from token:', {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
            picture: decodedToken.picture
        });

        // Attach user info to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
            picture: decodedToken.picture
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(403).json({ 
            error: 'Invalid or expired token',
            message: error.message 
        });
    }
};

module.exports = { authenticateToken };
