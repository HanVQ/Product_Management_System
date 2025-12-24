// Toggle between login and signup forms
function toggleForms() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const dashboard = document.getElementById('dashboard');

    loginForm.classList.toggle('active');
    signupForm.classList.toggle('active');
    dashboard.classList.remove('active');

    // Clear messages
    document.getElementById('login-message').innerHTML = '';
    document.getElementById('signup-message').innerHTML = '';
    document.getElementById('login-message').classList.remove('show', 'success', 'error');
    document.getElementById('signup-message').classList.remove('show', 'success', 'error');
}

// Show message
function showMessage(elementId, message, type) {
    const messageEl = document.getElementById(elementId);
    messageEl.textContent = message;
    messageEl.classList.add('show', type);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 5000);
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Save token
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect admin users to admin dashboard; otherwise show regular dashboard
            if (data.user && data.user.role === 'admin') {
                window.location = '/admin';
                return;
            }

            // Show dashboard for regular users
            showDashboard(data.user, data.token);
            showMessage('login-message', 'Login successful!', 'success');
        } else {
            showMessage('login-message', data.message, 'error');
        }
    } catch (error) {
        showMessage('login-message', 'Error: ' + error.message, 'error');
    }
}

// Handle signup
async function handleSignup(event) {
    event.preventDefault();

    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (password.length < 6) {
        showMessage('signup-message', 'Password must be at least 6 characters', 'error');
        return;
    }

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Do NOT auto-login after signup. Require email verification first.
            // If server returned an email preview URL (dev/test mode), show it.
            if (data.emailPreviewUrl) {
                const signupMsg = document.getElementById('signup-message');
                signupMsg.classList.add('show', 'success');
                signupMsg.innerHTML = 'Account created successfully! Preview the verification email <a href="' + data.emailPreviewUrl + '" target="_blank">here</a>.';
            } else {
                showMessage('signup-message', 'Account created successfully! Please check your email for the verification link before logging in.', 'success');
            }
        } else {
            showMessage('signup-message', data.message, 'error');
        }
    } catch (error) {
        showMessage('signup-message', 'Error: ' + error.message, 'error');
    }
}

// Show dashboard
function showDashboard(user, token) {
    // Ẩn form Login và Signup
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('signup-form').classList.remove('active');
    
    // Chỉ hiển thị Dashboard
    const dashboard = document.getElementById('dashboard');
    dashboard.classList.add('active'); 

    // Cập nhật thông tin trên dashboard
    document.getElementById('user-name').textContent = user.name || '';
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-id').textContent = user.id;
    document.getElementById('token-display').value = token;
}

// Copy token to clipboard
function copyToken() {
    const tokenDisplay = document.getElementById('token-display');
    tokenDisplay.select();
    document.execCommand('copy');
    
    showMessage('dashboard-message', 'Token copied to clipboard!', 'success');
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('login-form').classList.add('active');

    // Clear form fields
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('signup-name').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-password').value = '';

    showMessage('login-message', 'Logged out successfully!', 'success');
}

// Check if user is already logged in
window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
        const u = JSON.parse(user);
        // If stored user is admin, redirect to admin UI
        if (u && u.role === 'admin') {
            window.location = '/admin';
            return;
        }
        showDashboard(u, token);
    }
});

// If redirected from OAuth callback with token in query, save it
window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const name = params.get('name');
    const email = params.get('email');
    const id = params.get('id');

    if (token && name && email && id) {
        const user = { id, name, email };
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        showDashboard(user, token);

        // Remove query params from URL
        const cleanUrl = window.location.origin + window.location.pathname;
        history.replaceState({}, document.title, cleanUrl);
    }
});
