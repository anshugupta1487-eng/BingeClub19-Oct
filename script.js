// API Configuration
const API_KEY = '26722011';
const API_BASE_URL = 'https://www.omdbapi.com/';

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
        
        if (data.Response === 'True') {
            displayMovieData(data);
        } else {
            showError(data.Error || 'Movie/TV show not found');
        }
    } catch (err) {
        showError('Failed to fetch data. Please check your internet connection.');
        console.error('Error:', err);
    }
}

// Fetch Movie Data from OMDb API
async function fetchMovieData(title) {
    const url = `${API_BASE_URL}?t=${encodeURIComponent(title)}&apikey=${API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

// Display Movie Data
function displayMovieData(data) {
    // Set basic info
    movieTitle.textContent = data.Title || 'N/A';
    movieYear.textContent = data.Year || 'N/A';
    moviePlot.textContent = data.Plot || 'No plot available';
    
    // Clear previous ratings
    ratingsContainer.innerHTML = '';
    
    // Display ratings
    if (data.Ratings && data.Ratings.length > 0) {
        data.Ratings.forEach(rating => {
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
});
