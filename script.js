// ============================================
// CONFIGURATION (XANO)
// ============================================

// Your Xano API Base URL
const API_BASE = "https://x8ki-letl-twmt.n7.xano.io/api:kvWzD1tE";

// ==========================
// 1. PUBLIC WEBSITE LOGIC
// ==========================

const fleetContainer = document.getElementById('fleet-container');

// Load Fleet from Xano
async function loadFleet() {
    if (!fleetContainer) return;

    try {
        const response = await fetch(`${API_BASE}/fleet`);
        const cars = await response.json();

        fleetContainer.innerHTML = '';
        
        if (!cars || cars.length === 0) {
            fleetContainer.innerHTML = '<p style="color:gray">No cars available at the moment.</p>';
            return;
        }

        cars.forEach(car => {
            // Note: Xano uses snake_case (price_daily) not camelCase
            const card = `
                <div class="car-card scroll-animate visible">
                    <div class="car-tag">${car.year}</div>
                    <div class="car-info">
                        <h3>${car.name}</h3>
                        <div class="pricing">
                            <span>Daily: SAR ${car.price_daily}</span>
                            <span>Weekly: SAR ${car.price_weekly}</span>
                            <span>Monthly: SAR ${car.price_monthly}</span>
                        </div>
                        <button class="btn outline-btn" 
                            onclick="openBooking('${car.name}')">
                            Book Now
                        </button>
                    </div>
                </div>
            `;
            fleetContainer.innerHTML += card;
        });
    } catch (error) {
        console.error('Error loading fleet:', error);
        fleetContainer.innerHTML = '<p style="color:white">System Offline. Please call us.</p>';
    }
}

// Booking Modal Logic
const modal = document.getElementById('bookingModal');
const bookingForm = document.getElementById('bookingForm');
let selectedCar = "";

window.openBooking = (carName) => {
    selectedCar = carName;
    document.getElementById('modalCarName').innerText = "Requesting: " + selectedCar;
    modal.style.display = 'flex';
};

if (document.querySelector('.close-modal')) {
    document.querySelector('.close-modal').addEventListener('click', () => modal.style.display = 'none');
}

// Submit Reservation to Xano
if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            client_name: document.getElementById('clientName').value,
            client_phone: document.getElementById('clientPhone').value,
            car_name: selectedCar,
            duration: document.getElementById('clientDuration').value
        };

        try {
            const response = await fetch(`${API_BASE}/reservation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Request sent! We will call you shortly.");
                modal.style.display = 'none';
                bookingForm.reset();
            } else {
                alert("Error sending request. Please call us.");
            }
        } catch (error) {
            alert("Network Error: " + error.message);
        }
    });
}

// ==========================
// 2. ADMIN PANEL LOGIC
// ==========================

// Simple Auth
const ADMIN_EMAIL = "admin@marsana.com";
const ADMIN_PASS = "password123"; 

const adminLinkBtn = document.getElementById('admin-link-btn');
const adminModal = document.getElementById('adminModal');
const closeAdmin = document.querySelector('.close-admin');
const loginForm = document.getElementById('loginForm');
const dashboard = document.getElementById('dashboard');
const loginScreen = document.getElementById('loginScreen');

// Open Admin
if(adminLinkBtn) {
    adminLinkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        adminModal.style.display = 'flex';
        checkSession();
    });
}

// Close Admin
if(closeAdmin) {
    closeAdmin.addEventListener('click', () => adminModal.style.display = 'none');
}

function checkSession() {
    if (sessionStorage.getItem('isAdmin') === 'true') {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'block';
        loadAdminData();
    } else {
        loginScreen.style.display = 'block';
        dashboard.style.display = 'none';
    }
}

// Login Handler
if(loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value;
        const pass = document.getElementById('adminPass').value;

        if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
            sessionStorage.setItem('isAdmin', 'true');
            checkSession();
        } else {
            alert("Invalid Credentials");
        }
    });
}

// Logout
if(document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.removeItem('isAdmin');
        checkSession();
    });
}

// Add New Car to Xano
if(document.getElementById('addCarForm')) {
    document.getElementById('addCarForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            name: document.getElementById('carName').value,
            year: document.getElementById('carYear').value,
            price_daily: parseInt(document.getElementById('priceDaily').value),
            price_weekly: parseInt(document.getElementById('priceWeekly').value),
            price_monthly: parseInt(document.getElementById('priceMonthly').value)
        };

        try {
            const response = await fetch(`${API_BASE}/fleet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Car Added!");
                document.getElementById('addCarForm').reset();
                loadAdminData(); 
                loadFleet(); 
            } else {
                alert("Error adding car.");
            }
        } catch (error) {
            alert("Network Error");
        }
    });
}

// Load Admin Data
async function loadAdminData() {
    const adminList = document.getElementById('adminCarList');
    const resList = document.getElementById('reservationList');

    if(!adminList || !resList) return;

    // Fetch Fleet
    try {
        const fleetRes = await fetch(`${API_BASE}/fleet`);
        const cars = await fleetRes.json();
        
        adminList.innerHTML = '';
        if(cars && cars.length > 0) {
            cars.forEach(car => {
                adminList.innerHTML += `
                    <div class="car-list-item">
                        <span>${car.year} ${car.name}</span>
                        <span class="delete-btn" onclick="deleteCar(${car.id})">DELETE</span>
                    </div>
                `;
            });
        }
    } catch (e) { console.log(e); }

    // Fetch Reservations
    try {
        const resRes = await fetch(`${API_BASE}/reservation`);
        const reservations = await resRes.json();

        resList.innerHTML = '';
        if(reservations && reservations.length > 0) {
            reservations.forEach(res => {
                resList.innerHTML += `
                    <div style="background:#222; margin-bottom:10px; padding:10px; font-size:0.9rem;">
                        <div style="color:var(--marsana-red); font-weight:bold;">${res.client_name}</div>
                        <div>${res.client_phone}</div>
                        <div>${res.car_name} (${res.duration})</div>
                        <small style="color:#666;">ID: ${res.id}</small>
                    </div>
                `;
            });
        }
    } catch (e) { console.log(e); }
}

// Delete Car
window.deleteCar = async (id) => {
    if(confirm("Delete this car?")) {
        try {
            await fetch(`${API_BASE}/fleet/${id}`, { method: 'DELETE' });
            loadAdminData();
            loadFleet();
        } catch (e) {
            alert("Delete failed.");
        }
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    loadFleet();
    
    // Scroll Animation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    });
    document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));
});
