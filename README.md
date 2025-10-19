# 🎬 Binge Club

A modern web application for discovering movie and TV show ratings using the OMDb API.

## Features

- 🔍 Search for movies and TV shows
- ⭐ View ratings from multiple sources (IMDb, Rotten Tomatoes, etc.)
- 📱 Responsive design for all devices
- 🚀 Fast and modern UI/UX
- 🔧 RESTful API architecture
- 🛡️ Ready for authentication and database integration

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **API**: OMDb API
- **Architecture**: RESTful API with separation of concerns

## Project Structure

```
binge-club/
├── public/                 # Static files
│   ├── css/
│   │   └── styles.css     # Frontend styles
│   ├── js/
│   │   └── script.js      # Frontend JavaScript
│   └── index.html         # Main HTML page
├── routes/                # API routes
│   └── movies.js          # Movie-related endpoints
├── config/                # Configuration files
├── middleware/            # Custom middleware
├── server.js              # Main server file
├── package.json           # Dependencies
├── .env                   # Environment variables
└── README.md              # This file
```

## API Endpoints

- `GET /` - Serve the main application
- `GET /api/movies/search?title={title}` - Search for movies/TV shows
- `GET /api/movies/health` - API health check
- `GET /health` - Server health check

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/anshugupta1487-eng/BingeClub19-Oct.git
cd BingeClub19-Oct
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and visit `http://localhost:3000`

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
OMDB_API_KEY=your_omdb_api_key
```

## Deployment

This application is ready for deployment on platforms like:
- Render
- Heroku
- Vercel
- Railway

### Render Deployment

1. Connect your GitHub repository to Render
2. Set the build command: `npm install`
3. Set the start command: `npm start`
4. Add environment variables in Render dashboard

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] User favorites and watchlists
- [ ] User reviews and ratings
- [ ] Social features (sharing, recommendations)
- [ ] Advanced search filters
- [ ] Caching for better performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Author

**Anshu Gupta**
- GitHub: [@anshugupta1487-eng](https://github.com/anshugupta1487-eng)

---

Made with ❤️ for movie and TV show enthusiasts!
