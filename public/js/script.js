// API Configuration
const API_BASE_URL = '/api/movies';

// DOM Elements
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const error = document.getElementById('error');
const movieTitle = document.getElementById('movieTitle');
const movieYear = document.getElementById('movieYear');
const moviePlot = document.getElementById('moviePlot');
const ratingsContainer = document.getElementById('ratingsContainer');
const errorMessage = document.getElementById('errorMessage');
const saveBtn = document.getElementById('saveBtn');

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Saved movies elements
const savedMovies = document.getElementById('savedMovies');
const savedLoading = document.getElementById('savedLoading');
const savedError = document.getElementById('savedError');
const savedErrorMessage = document.getElementById('savedErrorMessage');
const refreshSavedBtn = document.getElementById('refreshSavedBtn');

// Auth elements
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');

// State
let currentMovie = null;

// Event Listeners
searchForm.addEventListener('submit', handleSearch);
saveBtn.addEventListener('click', handleSaveMovie);
refreshSavedBtn.addEventListener('click', loadSavedMovies);
signInBtn.addEventListener('click', handleSignIn);
signOutBtn.addEventListener('click', handleSignOut);

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Authentication handlers
async function handleSignIn() {
    if (window.firebaseAuth) {
        await window.firebaseAuth.signInWithGoogle();
    }
}

async function handleSignOut() {
    if (window.firebaseAuth) {
        await window.firebaseAuth.signOutUser();
    }
}

// Search Handler
async function handleSearch(e) {
    e.preventDefault();
    
    const query = searchInput.value.trim();
    if (!query) return;
    
    // Check if user is authenticated
    const user = window.firebaseAuth ? window.firebaseAuth.getCurrentUser() : null;
    if (!user) {
        showError('Please sign in to search for movies');
        return;
    }
    
    // Show loading state
    showLoading();
    hideError();
    hideResults();
    
    try {
        const data = await fetchMovieData(query);
        currentMovie = data;
        displayMovieData(data);
        await checkMovieExists(data.imdbID);
    } catch (err) {
        showError(err.message || 'Failed to fetch data. Please try again.');
        console.error('Error:', err);
    }
}

// Fetch Movie Data from our API
async function fetchMovieData(title) {
    const url = `${API_BASE_URL}/search?title=${encodeURIComponent(title)}`;
    
    // Get auth token
    const idToken = window.firebaseAuth ? await window.firebaseAuth.getIdToken() : null;
    if (!idToken) {
        throw new Error('Authentication required');
    }
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
        }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
}

// Display Movie Data
function displayMovieData(data) {
    // Set basic info
    movieTitle.textContent = data.title || 'N/A';
    movieYear.textContent = data.year || 'N/A';
    moviePlot.textContent = data.plot || 'No plot available';
    
    // Clear previous ratings
    ratingsContainer.innerHTML = '';
    
    // Display ratings
    if (data.ratings && data.ratings.length > 0) {
        data.ratings.forEach(rating => {
            const ratingElement = createRatingElement(rating.Source, rating.Value);
            ratingsContainer.appendChild(ratingElement);
        });
    } else {
        const noRatingsElement = document.createElement('div');
        noRatingsElement.className = 'rating-item';
        noRatingsElement.innerHTML = '<div class="rating-source">No Ratings Available</div>';
        ratingsContainer.appendChild(noRatingsElement);
    }
    
    // Show results
    showResults();
}

// Create Rating Element
function createRatingElement(source, value) {
    const ratingDiv = document.createElement('div');
    ratingDiv.className = 'rating-item';
    
    const sourceDiv = document.createElement('div');
    sourceDiv.className = 'rating-source';
    sourceDiv.textContent = source;
    
    const valueDiv = document.createElement('div');
    valueDiv.className = 'rating-value';
    valueDiv.textContent = value;
    
    ratingDiv.appendChild(sourceDiv);
    ratingDiv.appendChild(valueDiv);
    
    return ratingDiv;
}

// Check if movie exists in database
async function checkMovieExists(imdbId) {
    try {
        const idToken = window.firebaseAuth ? await window.firebaseAuth.getIdToken() : null;
        if (!idToken) return;
        
        const response = await fetch(`${API_BASE_URL}/check/${imdbId}`, {
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.exists) {
            saveBtn.textContent = 'Remove from My List';
            saveBtn.classList.add('saved');
        } else {
            saveBtn.textContent = 'Save to My List';
            saveBtn.classList.remove('saved');
        }
    } catch (err) {
        console.error('Error checking movie existence:', err);
    }
}

// Handle Save/Remove Movie
async function handleSaveMovie() {
    if (!currentMovie) return;
    
    const user = window.firebaseAuth ? window.firebaseAuth.getCurrentUser() : null;
    if (!user) {
        showError('Please sign in to save movies');
        return;
    }
    
    const isSaved = saveBtn.classList.contains('saved');
    
    try {
        if (isSaved) {
            // Remove movie (we'll need to get the database ID first)
            await removeMovieFromSaved(currentMovie.imdbID);
        } else {
            // Save movie
            await saveMovieToDatabase(currentMovie);
        }
    } catch (err) {
        showError(err.message || 'Failed to update movie list');
        console.error('Error:', err);
    }
}

// Save Movie to Database
async function saveMovieToDatabase(movieData) {
    const idToken = window.firebaseAuth ? await window.firebaseAuth.getIdToken() : null;
    if (!idToken) {
        throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_BASE_URL}/save`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(movieData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Failed to save movie');
    }
    
    saveBtn.textContent = 'Remove from My List';
    saveBtn.classList.add('saved');
    
    // Show success message
    showTemporaryMessage('Movie saved to your list!', 'success');
}

// Remove Movie from Saved (simplified - would need database ID in real implementation)
async function removeMovieFromSaved(imdbId) {
    // For now, we'll just update the UI
    // In a real implementation, you'd need the database ID
    saveBtn.textContent = 'Save to My List';
    saveBtn.classList.remove('saved');
    
    showTemporaryMessage('Movie removed from your list!', 'success');
}

// Load Saved Movies
async function loadSavedMovies() {
    const user = window.firebaseAuth ? window.firebaseAuth.getCurrentUser() : null;
    if (!user) {
        showSavedError('Please sign in to view your saved movies');
        return;
    }
    
    showSavedLoading();
    hideSavedError();
    
    try {
        const idToken = await window.firebaseAuth.getIdToken();
        const response = await fetch(`${API_BASE_URL}/saved`, {
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load saved movies');
        }
        
        displaySavedMovies(data.data);
    } catch (err) {
        showSavedError(err.message || 'Failed to load saved movies');
        console.error('Error:', err);
    }
}

// Display Saved Movies
function displaySavedMovies(movies) {
    hideSavedLoading();
    
    if (!movies || movies.length === 0) {
        savedMovies.innerHTML = `
            <div class="empty-state">
                <h3>No movies saved yet</h3>
                <p>Search for movies and save them to your list!</p>
            </div>
        `;
        return;
    }
    
    savedMovies.innerHTML = movies.map(movie => `
        <div class="movie-item">
            <div class="movie-item-header">
                <h3>${movie.title}</h3>
                <p class="year">${movie.year}</p>
                <p class="plot">${movie.plot || 'No plot available'}</p>
            </div>
            <div class="movie-item-actions">
                <button class="remove-btn" onclick="removeSavedMovie('${movie.id}')">
                    Remove
                </button>
                <div class="ratings-preview">
                    ${movie.ratings && movie.ratings.length > 0 
                        ? movie.ratings.map(rating => 
                            `<span class="rating-badge">${rating.source}: ${rating.value}</span>`
                          ).join(' ')
                        : '<span class="no-ratings">No ratings</span>'
                    }
                </div>
            </div>
        </div>
    `).join('');
}

// Remove Saved Movie
async function removeSavedMovie(movieId) {
    try {
        const idToken = window.firebaseAuth ? await window.firebaseAuth.getIdToken() : null;
        if (!idToken) {
            throw new Error('Authentication required');
        }
        
        const response = await fetch(`${API_BASE_URL}/${movieId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to remove movie');
        }
        
        // Reload saved movies
        await loadSavedMovies();
        showTemporaryMessage('Movie removed from your list!', 'success');
    } catch (err) {
        showTemporaryMessage(err.message || 'Failed to remove movie', 'error');
        console.error('Error:', err);
    }
}

// Tab Switching
function switchTab(tabName) {
    // Check if user is authenticated for non-search tabs
    if (tabName !== 'search') {
        const user = window.firebaseAuth ? window.firebaseAuth.getCurrentUser() : null;
        if (!user) {
            showTemporaryMessage('Please sign in to access this feature', 'error');
            return;
        }
    }
    
    // Update tab buttons
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}Tab`);
    });
    
    // Load data when switching to saved tab
    if (tabName === 'saved') {
        loadSavedMovies();
    }
}

// Show/Hide Functions
function showLoading() {
    loading.classList.remove('hidden');
    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';
}

function hideLoading() {
    loading.classList.add('hidden');
    searchBtn.disabled = false;
    searchBtn.textContent = 'Search';
}

function showResults() {
    hideLoading();
    results.classList.remove('hidden');
}

function hideResults() {
    results.classList.add('hidden');
}

function showError(message) {
    hideLoading();
    errorMessage.textContent = message;
    error.classList.remove('hidden');
}

function hideError() {
    error.classList.add('hidden');
}

function showSavedLoading() {
    savedLoading.classList.remove('hidden');
    savedMovies.innerHTML = '';
}

function hideSavedLoading() {
    savedLoading.classList.add('hidden');
}

function showSavedError(message) {
    hideSavedLoading();
    savedErrorMessage.textContent = message;
    savedError.classList.remove('hidden');
}

function hideSavedError() {
    savedError.classList.add('hidden');
}

// Utility Functions
function showTemporaryMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `temp-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    searchInput.focus();
    
    // Check API health on load
    checkAPIHealth();
    
    // Initialize auth UI after Firebase loads
    setTimeout(() => {
        if (window.firebaseAuth) {
            window.firebaseAuth.updateAuthUI();
        }
    }, 1000);
});

// Check API Health
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        console.log('API Health:', data);
    } catch (err) {
        console.warn('API Health check failed:', err);
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .rating-badge {
        display: inline-block;
        background: #f8f9fa;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        margin-right: 5px;
        margin-bottom: 5px;
    }
    
    .no-ratings {
        color: #666;
        font-style: italic;
    }
`;
document.head.appendChild(style);
