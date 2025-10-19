// Firebase configuration
// IMPORTANT: Replace these with your ACTUAL Firebase config values from Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz", // REPLACE with your real API key
    authDomain: "your-project-id.firebaseapp.com", // REPLACE with your project ID
    projectId: "your-project-id", // REPLACE with your project ID
    storageBucket: "your-project-id.appspot.com", // REPLACE with your project ID
    messagingSenderId: "123456789012", // REPLACE with your sender ID
    appId: "1:123456789012:web:abcdef1234567890" // REPLACE with your app ID
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Configure Google provider
provider.setCustomParameters({
    prompt: 'select_account'
});

// Authentication state management
let currentUser = null;

// Sign in with Google
async function signInWithGoogle() {
    try {
        console.log('Attempting Google sign-in...');
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        console.log('Sign-in successful:', user);
        
        // Get ID token for backend verification
        const idToken = await user.getIdToken();
        
        // Store user data and token
        currentUser = {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            picture: user.photoURL,
            idToken: idToken
        };
        
        // Update UI
        updateAuthUI();
        
        // Show success message
        showTemporaryMessage('Successfully signed in!', 'success');
        
        return { success: true, user: currentUser };
    } catch (error) {
        console.error('Google sign-in error:', error);
        
        // More specific error messages
        let errorMessage = 'Failed to sign in. Please try again.';
        
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign-in was cancelled. Please try again.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Popup was blocked. Please allow popups and try again.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your connection.';
        } else if (error.code === 'auth/unauthorized-domain') {
            errorMessage = 'Domain not authorized. Please contact support.';
        } else if (error.code === 'auth/api-key-not-valid') {
            errorMessage = 'Firebase configuration error. Please contact support.';
        }
        
        showTemporaryMessage(errorMessage, 'error');
        return { success: false, error: error.message };
    }
}

// Sign out
async function signOutUser() {
    try {
        await signOut(auth);
        currentUser = null;
        
        // Update UI
        updateAuthUI();
        
        // Clear any user-specific data
        clearUserData();
        
        // Show success message
        showTemporaryMessage('Successfully signed out!', 'success');
        
        return { success: true };
    } catch (error) {
        console.error('Error signing out:', error);
        showTemporaryMessage('Failed to sign out. Please try again.', 'error');
        return { success: false, error: error.message };
    }
}

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user ? 'User signed in' : 'User signed out');
    
    if (user) {
        // User is signed in
        user.getIdToken().then((idToken) => {
            currentUser = {
                uid: user.uid,
                email: user.email,
                name: user.displayName,
                picture: user.photoURL,
                idToken: idToken
            };
            updateAuthUI();
        });
    } else {
        // User is signed out
        currentUser = null;
        updateAuthUI();
        clearUserData();
    }
});

// Update authentication UI
function updateAuthUI() {
    const authContainer = document.getElementById('authContainer');
    const userInfo = document.getElementById('userInfo');
    const signInBtn = document.getElementById('signInBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    
    if (currentUser) {
        // User is signed in
        if (userInfo) {
            userInfo.innerHTML = `
                <div class="user-profile">
                    <img src="${currentUser.picture}" alt="Profile" class="user-avatar">
                    <div class="user-details">
                        <span class="user-name">${currentUser.name}</span>
                        <span class="user-email">${currentUser.email}</span>
                    </div>
                </div>
            `;
        }
        
        if (signInBtn) signInBtn.style.display = 'none';
        if (signOutBtn) signOutBtn.style.display = 'block';
        
        // Enable app functionality
        enableAppFeatures();
    } else {
        // User is signed out
        if (userInfo) {
            userInfo.innerHTML = '';
        }
        
        if (signInBtn) signInBtn.style.display = 'block';
        if (signOutBtn) signOutBtn.style.display = 'none';
        
        // Disable app functionality
        disableAppFeatures();
    }
}

// Enable app features for authenticated users
function enableAppFeatures() {
    // Enable search form
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.style.display = 'block';
    }
    
    // Enable tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
    });
    
    // Load saved movies if on saved tab
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab && activeTab.dataset.tab === 'saved') {
        loadSavedMovies();
    }
}

// Disable app features for unauthenticated users
function disableAppFeatures() {
    // Hide search form
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.style.display = 'none';
    }
    
    // Disable tabs except search
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        if (btn.dataset.tab !== 'search') {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        }
    });
    
    // Clear results and saved movies
    const results = document.getElementById('results');
    const savedMovies = document.getElementById('savedMovies');
    if (results) results.classList.add('hidden');
    if (savedMovies) savedMovies.innerHTML = '';
}

// Clear user-specific data
function clearUserData() {
    // Clear search results
    const results = document.getElementById('results');
    if (results) results.classList.add('hidden');
    
    // Clear saved movies
    const savedMovies = document.getElementById('savedMovies');
    if (savedMovies) {
        savedMovies.innerHTML = `
            <div class="empty-state">
                <h3>Please sign in to view your saved movies</h3>
                <p>Sign in with Google to access your personal movie list!</p>
            </div>
        `;
    }
    
    // Reset current movie
    if (typeof currentMovie !== 'undefined') {
        currentMovie = null;
    }
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Get ID token for API calls
async function getIdToken() {
    if (currentUser) {
        // Refresh token if needed
        const user = auth.currentUser;
        if (user) {
            const idToken = await user.getIdToken();
            currentUser.idToken = idToken;
            return idToken;
        }
    }
    return null;
}

// Export functions for use in main script
window.firebaseAuth = {
    signInWithGoogle,
    signOutUser,
    getCurrentUser,
    getIdToken,
    updateAuthUI
};

// Show temporary message function (if not already defined)
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
