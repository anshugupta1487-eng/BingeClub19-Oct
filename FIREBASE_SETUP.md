# 🔐 Firebase Authentication + Supabase + Replit Setup Guide

## Overview
This guide will help you set up Firebase Authentication with Google Sign-In, Supabase database, and deploy to Replit.

## Step 1: Firebase Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `binge-club`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Authentication
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Google** provider
3. Toggle "Enable"
4. Add your project support email
5. Click "Save"

### 1.3 Get Firebase Configuration
1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click "Web app" icon (`</>`)
4. Register app with nickname: `binge-club-web`
5. Copy the Firebase config object

### 1.4 Generate Service Account Key
1. Go to **Project Settings** → **Service accounts**
2. Click "Generate new private key"
3. Download the JSON file
4. Keep this file secure - it contains sensitive credentials

## Step 2: Update Frontend Configuration

Update `public/js/firebase-config.js` with your Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "your_api_key_here",
    authDomain: "your_project_id.firebaseapp.com",
    projectId: "your_project_id",
    storageBucket: "your_project_id.appspot.com",
    messagingSenderId: "your_messaging_sender_id",
    appId: "your_app_id"
};
```

## Step 3: Supabase Setup

### 3.1 Create Supabase Project
1. Go to [Supabase](https://supabase.com)
2. Click "New Project"
3. Choose organization
4. Enter project details:
   - **Name**: `binge-club`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 3.2 Set Up Database Schema
1. Go to **SQL Editor** in Supabase dashboard
2. Copy the contents of `database/schema-with-auth.sql`
3. Paste and run the SQL commands

### 3.3 Get Supabase Credentials
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**
   - **anon public** key

## Step 4: Environment Variables

Update your `.env` file with all credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# OMDb API Configuration
OMDB_API_KEY=26722011

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Firebase Configuration (from service account JSON)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_firebase_client_id

# CORS Configuration
CORS_ORIGIN=https://your-replit-url.replit.app
```

## Step 5: Replit Deployment

### 5.1 Create Replit Project
1. Go to [Replit](https://replit.com)
2. Click "Create Repl"
3. Choose "Import from GitHub"
4. Enter your GitHub repository URL: `https://github.com/anshugupta1487-eng/BingeClub19-Oct.git`
5. Click "Import"

### 5.2 Configure Environment Variables
1. In Replit, go to **Secrets** tab (lock icon)
2. Add all environment variables from your `.env` file
3. Make sure to use the production values

### 5.3 Update CORS Settings
1. Update `CORS_ORIGIN` in secrets to your Replit URL
2. Format: `https://your-repl-name.username.replit.app`

### 5.4 Deploy
1. Click "Run" button
2. Replit will automatically install dependencies and start the server
3. Your app will be available at the Replit URL

## Step 6: Firebase Security Rules (Optional)

### 6.1 Update Firebase Auth Domain
1. In Firebase Console, go to **Authentication** → **Settings**
2. Add your Replit domain to "Authorized domains"
3. Format: `your-repl-name.username.replit.app`

### 6.2 Configure CORS
1. In your Replit project, update the CORS origin
2. Make sure it matches your Replit URL exactly

## Step 7: Testing

### 7.1 Test Authentication
1. Open your Replit app
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Verify user profile appears

### 7.2 Test Movie Search
1. Search for a movie
2. Verify results appear
3. Try saving a movie
4. Check "My Movies" tab

### 7.3 Test Database
1. Verify movies are saved to Supabase
2. Check that data is user-specific
3. Test sign out and sign in with different account

## Troubleshooting

### Common Issues:

1. **"Firebase config not found"**
   - Check that `firebase-config.js` has correct config
   - Verify all Firebase credentials are set

2. **"Authentication failed"**
   - Check Firebase service account credentials
   - Verify private key format (with \n characters)

3. **"Database connection failed"**
   - Check Supabase URL and key
   - Verify database schema was created

4. **"CORS errors"**
   - Update CORS_ORIGIN to match Replit URL
   - Check Firebase authorized domains

5. **"Movie not saving"**
   - Check user authentication
   - Verify database permissions
   - Check console for errors

### Getting Help:

- Check Replit console for errors
- Verify all environment variables are set
- Test API endpoints individually
- Check Firebase and Supabase logs

## Security Notes

- Never commit `.env` file to version control
- Keep Firebase service account key secure
- Use environment variables for all secrets
- Regularly rotate API keys
- Monitor usage in Firebase and Supabase dashboards

## Next Steps

Once basic functionality works:
- Add user profile management
- Implement movie categories/tags
- Add social features (sharing, recommendations)
- Set up monitoring and analytics
- Add error tracking (Sentry, etc.)

---

Happy coding! 🎬🔐
