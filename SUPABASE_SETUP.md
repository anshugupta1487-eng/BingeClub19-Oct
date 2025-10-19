# 🗄️ Supabase Setup Guide for Binge Club

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `binge-club`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait for the project to be ready (2-3 minutes)

## Step 2: Set Up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Copy the contents of `database/schema.sql`
4. Paste it into the SQL editor
5. Click **Run** to execute the schema

## Step 3: Get API Keys

1. In your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## Step 4: Update Environment Variables

Update your `.env` file with the Supabase credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# OMDb API Configuration
OMDB_API_KEY=26722011

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## Step 5: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open `http://localhost:3000`

3. Test the features:
   - Search for a movie
   - Save it to your list
   - Check the "My Movies" tab
   - View search history

## Step 6: Deploy to Render

### Environment Variables for Render:
- `NODE_ENV` = `production`
- `OMDB_API_KEY` = `26722011`
- `SUPABASE_URL` = `your_supabase_project_url`
- `SUPABASE_ANON_KEY` = `your_supabase_anon_key`
- `PORT` = (Render sets this automatically)

### Render Configuration:
- **Build Command**: `npm install`
- **Start Command**: `npm start`

## Database Tables Created

### 1. `movies` Table
Stores movie/TV show information:
- `id` - Unique identifier
- `title` - Movie/TV show title
- `year` - Release year
- `plot` - Plot description
- `imdb_id` - IMDB identifier (unique)
- `poster_url` - Poster image URL
- `genre` - Genres
- `director` - Director name
- `actors` - Cast information
- `imdb_rating` - IMDB rating
- `imdb_votes` - Number of IMDB votes
- `type` - 'movie' or 'series'
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### 2. `ratings` Table
Stores ratings from different sources:
- `id` - Unique identifier
- `movie_id` - Reference to movies table
- `source` - Rating source (IMDb, Rotten Tomatoes, etc.)
- `value` - Rating value
- `created_at` - Creation timestamp

### 3. `search_history` Table
Tracks search queries:
- `id` - Unique identifier
- `search_query` - The search term used
- `movie_id` - Reference to movies table (if movie was found)
- `searched_at` - Search timestamp

## Security Notes

- Row Level Security (RLS) is enabled
- Currently set to allow all operations for simplicity
- For production, consider implementing user authentication
- Update RLS policies based on your security requirements

## Troubleshooting

### Common Issues:

1. **"Missing Supabase environment variables"**
   - Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set correctly

2. **"Failed to save movie"**
   - Verify your Supabase project is active
   - Check that the database schema was created successfully

3. **"Movie already exists"**
   - This is normal behavior - movies are identified by IMDB ID
   - The app will show "Movie already exists" message

4. **CORS errors**
   - Make sure your Supabase project allows your domain
   - Check CORS settings in Supabase dashboard

### Getting Help:

- Check Supabase logs in the dashboard
- Verify API keys are correct
- Ensure database tables exist
- Check network connectivity

## Next Steps

Once basic functionality is working, consider:
- Adding user authentication
- Implementing user-specific movie lists
- Adding movie categories/tags
- Creating recommendation system
- Adding social features

---

Happy coding! 🎬
