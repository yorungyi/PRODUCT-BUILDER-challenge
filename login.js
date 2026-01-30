import { login } from './auth.js';

const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    errorMessage.style.display = 'none'; // 이전 에러 메시지 숨기기

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        showError('아이디와 비밀번호를 모두 입력해주세요.');
        return;
    }

    const user = login(username, password);

    if (user) {
        window.location.href = 'index.html';
    } else {
        showError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
});

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}
