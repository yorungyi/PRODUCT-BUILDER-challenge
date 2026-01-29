import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';
import { setDB, handleFormSubmit, handleCloseDay, handleAdminToggle, handleYearFilterChange, listenForData } from './store.js';
import { renderAll, openLog } from './ui.js';

// DOM Elements
const form = document.getElementById("salesForm");
const closeDayButton = document.getElementById("closeDay");
const adminToggle = document.getElementById("adminToggle");
const yearFilter = document.getElementById("yearFilter");
const logButton = document.getElementById("logButton");


// Initialization
async function init() {
    try {
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        setDB(db); // store.js에 DB 인스턴스 설정
        await listenForData(); // Firestore 데이터 실시간 수신 시작
        renderAll();
    } catch (error) {
        console.error("Firebase 초기화 실패:", error);
        alert("Firebase 설정을 확인해주세요. firebase-config.js 파일에 올바른 설정이 필요합니다.");
    }
}

// Event Listeners
form.addEventListener("submit", handleFormSubmit);
closeDayButton.addEventListener("click", handleCloseDay);
adminToggle.addEventListener("click", handleAdminToggle);
yearFilter.addEventListener("change", handleYearFilterChange);
logButton.addEventListener("click", openLog);

// Start the application
init();
