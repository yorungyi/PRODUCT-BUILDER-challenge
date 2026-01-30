import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';
import { setDB, handleFormSubmit, handleCloseDay, handleYearFilterChange, listenForData, initStore } from './store.js';
import { renderAll, openLog } from './ui.js';
import { isLoggedIn, logout, getCurrentUser } from './auth.js';
import './Button.js';

// DOM Elements
const form = document.getElementById("salesForm");
const closeDayButton = document.getElementById("closeDay");
const logoutButton = document.getElementById("logoutButton");
const yearFilter = document.getElementById("yearFilter");
const logButton = document.getElementById("logButton");


// Initialization
async function init() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        setDB(db);
        initStore(); // Set user state in store
        await listenForData();
        renderAll();
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        alert("Failed to initialize Firebase. Please check your configuration.");
    }
}

// Event Listeners
form.addEventListener("submit", handleFormSubmit);
closeDayButton.addEventListener("click", handleCloseDay);
logoutButton.addEventListener("click", logout);
yearFilter.addEventListener("change", handleYearFilterChange);
logButton.addEventListener("click", openLog);

// Start the application
init();