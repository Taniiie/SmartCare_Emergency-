const appState = {
    patientLat: 28.6139,
    patientLng: 77.2090,
    sosActive: false,
    ambulanceETA: 272,
    droneETA: 180,
    verifiedContacts: []
};

// --- Theme Management ---
function themeToggle() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('sc-theme', newTheme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('sc-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// --- Scroll Animations ---
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add a slight stagger effect
                entry.target.style.transitionDelay = `${index * 50}ms`;
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// --- Navigation ---
function initNav() {
    const path = window.location.pathname;
    const page = path.split("/").pop() || "index.html";
    
    document.querySelectorAll('nav a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === page) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Simple mobile toggle (placeholder for future implementation)
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && window.innerWidth < 640) {
        // Implement hamburger menu logic here if needed
    }
}

// --- Geolocation ---
function getLocation(callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                appState.patientLat = position.coords.latitude;
                appState.patientLng = position.coords.longitude;
                if (callback) callback(position.coords);
                toast("Location accurate", "info");
            },
            (error) => {
                console.warn("Geolocation blocked, using default (Delhi)", error);
                if (callback) callback({ latitude: 28.6139, longitude: 77.2090 });
                toast("Using default location", "info");
            }
        );
    } else {
        toast("Geolocation not supported", "error");
        if (callback) callback({ latitude: 28.6139, longitude: 77.2090 });
    }
}

// --- UI Helpers ---
function toast(message, type = 'success') {
    const toastDiv = document.createElement('div');
    toastDiv.className = `toast toast-${type}`;
    toastDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        background: var(--card);
        border: 1px solid var(--border);
        color: var(--text);
        font-family: 'DM Sans', sans-serif;
        font-size: 0.9rem;
        z-index: 9999;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        transform: translateX(120%);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        display: flex;
        align-items: center;
        gap: 0.75rem;
    `;

    let color = 'var(--green)';
    if (type === 'error') color = 'var(--red)';
    if (type === 'info') color = 'var(--cyan)';
    
    toastDiv.innerHTML = `<span style="width:10px; height:10px; border-radius:50%; background:${color};"></span> ${message}`;
    
    document.body.appendChild(toastDiv);
    
    // Animate in
    setTimeout(() => toastDiv.style.transform = 'translateX(0)', 100);
    
    // Auto-dismiss
    setTimeout(() => {
        toastDiv.style.transform = 'translateX(120%)';
        setTimeout(() => toastDiv.remove(), 300);
    }, 3000);
}

function formatETA(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function counterAnimate(el, target, duration = 1200) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            el.innerText = Math.floor(target);
            clearInterval(timer);
        } else {
            el.innerText = Math.floor(start);
        }
    }, 16);
}

// --- Lifecycle ---
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    initScrollAnimations();
    initNav();
});
