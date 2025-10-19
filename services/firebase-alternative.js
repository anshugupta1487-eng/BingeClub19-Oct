const admin = require('firebase-admin');

// Alternative Firebase initialization using JSON string
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Use JSON string from environment variable
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('✅ Using Firebase service account from JSON string');
    } catch (error) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', error.message);
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON format');
    }
} else {
    // Fallback to individual environment variables
    serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };
}

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });
        console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
        console.error('❌ Firebase Admin SDK initialization failed:', error.message);
        throw error;
    }
}

// Verify Firebase ID token
async function verifyIdToken(idToken) {
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return {
            success: true,
            user: {
                uid: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name,
                picture: decodedToken.picture
            }
        };
    } catch (error) {
        console.error('Error verifying ID token:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Get user by UID
async function getUser(uid) {
    try {
        const userRecord = await admin.auth().getUser(uid);
        return {
            success: true,
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                photoURL: userRecord.photoURL,
                emailVerified: userRecord.emailVerified
            }
        };
    } catch (error) {
        console.error('Error getting user:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    admin,
    verifyIdToken,
    getUser
};
