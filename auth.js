const USERS = {
    admin: { password: 'admin123', role: 'admin' },
    staff: { password: 'staff123', role: 'staff' },
};

const SESSION_KEY = 'northfarm_user';

export function login(username, password) {
    const user = USERS[username];
    if (user && user.password === password) {
        const userData = { username, role: user.role };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
        return userData;
    }
    return null;
}

export function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
}

export function getCurrentUser() {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY));
    } catch (e) {
        return null;
    }
}

export function isLoggedIn() {
    return getCurrentUser() !== null;
}

export function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}
