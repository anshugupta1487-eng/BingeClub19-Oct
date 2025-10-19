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

// Event Listeners
searchForm.addEventListener('submit', handleSearch);

// Search Handler
async function handleSearch(e) {
    e.preventDefault();
    
    const query = searchInput.value.trim();
    if (!query) return;
    
    // Show loading state
    showLoading();
    hideError();
    hideResults();
    
    try {
        const data = await fetchMovieData(query);
        displayMovieData(data);
    } catch (err) {
        showError(err.message || 'Failed to fetch data. Please try again.');
        console.error('Error:', err);
    }
}

// Fetch Movie Data from our API
async function fetchMovieData(title) {
    const url = `${API_BASE_URL}/search?title=${encodeURIComponent(title)}`;
    
    const response = await fetch(url);
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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    searchInput.focus();
    
    // Check API health on load
    checkAPIHealth();
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
