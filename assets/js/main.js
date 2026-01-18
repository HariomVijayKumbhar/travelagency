/**
 * Maharaja Travels - Main JavaScript Logic
 * Handles Authentication, Booking, Search, and UI Interactions
 */

document.addEventListener("DOMContentLoaded", () => {
    // Initialize required modules
    try { 
        Database.init(); 
        DB.init().then(() => {
            try { Auth.init(); } catch (e) { console.error("Auth Init Failed:", e); }
            try { Search.init(); } catch (e) { console.error("Search Init Failed:", e); }
            try { Booking.init(); } catch (e) { console.error("Booking Init Failed:", e); }
            try { Payment.init(); } catch (e) { console.error("Payment Init Failed:", e); }
            try { Profile.init(); } catch (e) { console.error("Profile Init Failed:", e); }
            try { Forms.init(); } catch (e) { console.error("Forms Init Failed:", e); }
            try { UI.init(); } catch (e) { console.error("UI Init Failed:", e); }
        }).catch(err => console.error("DB Init error:", err));
    } catch (e) { console.error("Database Init Failed:", e); }
});

// --- Database Module ---
const Database = {
    init: function() {
        if (!localStorage.getItem("users")) {
            localStorage.setItem("users", JSON.stringify([]));
        }
    },
    Users: {
        create: function(user) {
            const users = JSON.parse(localStorage.getItem("users"));
            user.id = 'USR' + Date.now();
            users.push(user);
            localStorage.setItem("users", JSON.stringify(users));
            return user;
        },
        findByEmail: function(email) {
            const users = JSON.parse(localStorage.getItem("users"));
            return users.find(u => u.email === email);
        },
        verify: function(email, password) {
            const users = JSON.parse(localStorage.getItem("users"));
            return users.find(u => u.email === email && u.password === password);
        }
    },
    Bookings: {
        add: function(booking) {
            return DB.addBooking(booking);
        },
        getAll() {
            return DB.getAllBookings();
        },
        getByUser(email) {
            return DB.getBookingsByEmail(email);
        }
    }
};

// --- Modal Manager (Removed - Using Dedicated Pages) ---
const ModalManager = {
    init: function() {
        // No longer injecting auth modals.
        // We can keep this if we want to inject other modals later, but for now Auth is page-based.
        // Checking for auth css is still good if key styles are shared.
        if (!document.getElementById('auth-css')) {
            const link = document.createElement('link');
            link.id = 'auth-css';
            link.rel = 'stylesheet';
            link.href = window.location.pathname.includes('/pages/') ? '../assets/css/auth.css' : 'assets/css/auth.css';
            document.head.appendChild(link);
        }
    }
};

// --- Authentication Module ---
const Auth = {
    init: function () {
        // Run updateUI immediately to set initial state
        this.updateUI();
        this.bindEvents();
    },

    bindEvents: function () {
        // Delegate events since forms are dynamic
        document.body.addEventListener('submit', (e) => {
            // Handle Login Page Form
            if (e.target && e.target.id === 'loginPageForm') {
                e.preventDefault();
                this.login();
            }
            // Handle Register Page Form
            if (e.target && e.target.id === 'registerPageForm') {
                e.preventDefault();
                this.register();
            }
        });

        document.addEventListener("click", (e) => {
            // Logout
            if (e.target && (e.target.id === "logoutBtn" || e.target.id === "logoutBtnNav")) {
                e.preventDefault();
                this.logout();
            }
            // Navigate to History
            if (e.target && e.target.id === "historyBtn") {
                e.preventDefault();
                Payment.showHistory(); // Use Payment module to show history
            }
        });
    },

    register: function () {
        const name = document.getElementById("registerName").value;
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("registerConfirmPassword").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (Database.Users.findByEmail(email)) {
             alert("User with this email already exists.");
             return;
        }

        // Create User
        const newUser = Database.Users.create({ name, email, password });
        
        // Auto Login
        localStorage.setItem("currentUser", JSON.stringify(newUser));
        
        alert("Registration Successful! Welcome to Maharaja Travels.");
        
        // Redirect to Profile
        window.location.href = "profile.html";
    },

    login: function () {
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        const user = Database.Users.verify(email, password);

        if (user) {
            localStorage.setItem("currentUser", JSON.stringify(user));
            alert(`Welcome back, ${user.name}!`);
            
            // Redirect to Home
            window.location.href = "../index.html";
        } else {
            alert("Invalid email or password. Please try again.");
        }
    },

    logout: function () {
        if (confirm("Are you sure you want to logout?")) {
            localStorage.removeItem("currentUser");
            
            // If on profile page, redirect to home
            if (window.location.pathname.includes('profile.html')) {
                window.location.href = "../index.html";
            } else {
                this.updateUI(); // Update UI immediately instead of reload for smoother feel
                window.location.reload(); // Reload to clear any specific state if needed
            }
        }
    },

    isLoggedIn: function () {
        return !!localStorage.getItem("currentUser");
    },

    getCurrentUser: function () {
        return JSON.parse(localStorage.getItem("currentUser"));
    },

    updateUI: function () {
        const navList = document.querySelector(".navbar-nav");
        // If on profile page, the nav structure is different/simplified, so we might skip or adapt
        if (!navList) return;

        const user = this.getCurrentUser();

        // 1. Remove any existing User Dropdown (to avoid duplicates)
        const existingAuthItems = document.querySelectorAll(".auth-item");
        // Don't remove if it is the static logout button on profile page
        if (!window.location.pathname.includes('profile.html')) {
             existingAuthItems.forEach((el) => el.remove());
        }

        // 2. Select the Static Login/Register Links
        // We use the class 'auth-link' which we added to index.html
        const staticLinks = document.querySelectorAll('.auth-link');

        if (user) {
            // LOGGED IN STATE
            
            // Hide static links
            staticLinks.forEach(link => {
                // Hide the parent list item (<li>)
                if(link.parentElement) link.parentElement.style.display = 'none';
            });

            // Add User Dropdown (Only on non-profile pages)
            if (!window.location.pathname.includes('profile.html')) {
                const userItem = `
                    <li class="nav-item auth-item dropdown">
                        <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" class="nav-avatar" alt="Profile">
                            ${user.name}
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                            <!-- Removed 'My Profile' link as per request -->
                            <li><a class="dropdown-item" href="#" id="logoutBtn">Logout</a></li>
                        </ul>
                    </li>
                `;
                navList.insertAdjacentHTML("beforeend", userItem);
            }
            
        } else {
            // LOGGED OUT STATE
            
            // Show static links
            staticLinks.forEach(link => {
                if(link.parentElement) link.parentElement.style.display = ''; // Reset to default (block/list-item)
            });
            
            // If on profile page but logged out, redirect to login
            if (window.location.pathname.includes('profile.html')) {
                window.location.href = "login.html";
            }
        }
    },
};

// --- Profile Module ---
const Profile = {
    init: function() {
        if (!window.location.pathname.includes('profile.html')) return;
        
        const user = Auth.getCurrentUser();
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        this.loadUserData(user);
        this.loadBookings(user.email);
    },

    loadUserData: function(user) {
        const nameEl = document.getElementById('profileName');
        const emailEl = document.getElementById('profileEmail');
        
        if(nameEl) nameEl.textContent = user.name;
        if(emailEl) emailEl.textContent = user.email;
    },

    loadBookings: function(email) {
        Database.Bookings.getByUser(email).then(bookings => {
            const tbody = document.getElementById('profileBookingsBody');
            const noBookingsMsg = document.getElementById('noBookingsMsg');

            if (!tbody) return;
            tbody.innerHTML = '';

            if (bookings.length === 0) {
                tbody.closest('table').classList.add('d-none');
                if(noBookingsMsg) noBookingsMsg.classList.remove('d-none');
            } else {
                tbody.closest('table').classList.remove('d-none');
                if(noBookingsMsg) noBookingsMsg.classList.add('d-none');

                bookings.forEach(booking => {
                    const row = `
                        <tr>
                            <td>
                                <div class="fw-bold">${booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'}</div>
                                <small class="text-muted">ID: ${booking.id || '-'}</small>
                            </td>
                            <td>
                                <div class="fw-bold text-primary">${booking.package}</div>
                                <small>${booking.travelers} Travelers</small>
                            </td>
                            <td>
                                <div class="fw-bold">${booking.total}</div>
                                <small class="text-muted">${booking.method || 'Pending'}</small>
                            </td>
                            <td>
                                <span class="badge bg-${booking.status === 'Confirmed' ? 'success' : 'warning'} rounded-pill">
                                    ${booking.status}
                                </span>
                            </td>
                        </tr>
                    `;
                    tbody.insertAdjacentHTML('beforeend', row);
                });
            }
        });
    }
};

// --- Search Module ---
const Search = {
    init: function () {
        const searchInput = document.getElementById("searchDestinations");
        const destinationsContainer = document.getElementById("destinationsContainer");

        if (searchInput && destinationsContainer) {
            const destinationCards = destinationsContainer.getElementsByClassName("col-lg-4");

            searchInput.addEventListener("input", function () {
                const filter = this.value.toLowerCase();

                Array.from(destinationCards).forEach(function (card) {
                    const title = card.querySelector(".destination-info h3").textContent.toLowerCase();
                    const description = card.querySelector(".destination-info p").textContent.toLowerCase();

                    if (title.includes(filter) || description.includes(filter)) {
                        card.style.display = "";
                    } else {
                        card.style.display = "none";
                    }
                });
            });
        }
    },
};

// --- Booking Module ---
const Booking = {
    packagePrices: {
        "Standard Package": 8500,
        "Premium Package": 12500,
        "Luxury Package": 18000,
        "Custom Package": 0,
    },
    discountRate: 0.2,
    isDiscountApplied: false,

    init: function () {
        this.bindEvents();
    },

    bindEvents: function () {
        // Book Now Buttons
        const buttons = document.querySelectorAll(".book-now");
        buttons.forEach((button) => {
            button.addEventListener("click", (e) => {
                e.preventDefault();

                // Check for Auth preference (Optional: Force login? No, keep guest active as per user previous approval)
                // But we can autofill if logged in
                const user = Auth.getCurrentUser();

                this.isDiscountApplied = false;
                const packageName = e.target.getAttribute("data-package");
                const packageSelect = document.getElementById("package");
                if (packageSelect) {
                    packageSelect.value = packageName;
                    this.updatePrice();
                }
                
                // Autofill or Clear
                const nameInput = document.getElementById("name");
                const emailInput = document.getElementById("email");
                if (nameInput) nameInput.value = user ? user.name : "";
                if (emailInput) emailInput.value = user ? user.email : "";

                const bookingModalEl = document.getElementById("bookingModal");
                if (bookingModalEl) {
                    const bookingModal = new bootstrap.Modal(bookingModalEl);
                    bookingModal.show();
                } else {
                    console.error("Booking modal ID missing");
                }
            });
        });

        const packageSelect = document.getElementById("package");
        const travelersInput = document.getElementById("travelers");

        if (packageSelect) packageSelect.addEventListener("change", () => this.updatePrice());
        if (travelersInput) travelersInput.addEventListener("input", () => this.updatePrice());

        // Offer Application
        const applyOfferBtn = document.getElementById("applyOfferBtn");
        if (applyOfferBtn) {
            applyOfferBtn.addEventListener("click", () => {
                this.isDiscountApplied = true;
                this.updatePrice();

                const offerModalEl = document.getElementById("offerModal");
                if (offerModalEl) {
                    const offerModal = bootstrap.Modal.getInstance(offerModalEl);
                    if (offerModal) offerModal.hide();
                }

                const offerAppliedModalEl = document.getElementById("offerAppliedModal");
                if (offerAppliedModalEl) {
                    const offerAppliedModal = new bootstrap.Modal(offerAppliedModalEl);
                    offerAppliedModal.show();
                }
            });
        }

        // Booking Submission
        const bookingForm = document.getElementById("bookingForm");
        if (bookingForm) {
            bookingForm.addEventListener("submit", (e) => {
                e.preventDefault();

                const packageSelect = document.getElementById("package");
                const travelersInput = document.getElementById("travelers");
                const totalSpan = document.getElementById("totalAmount");
                const nameInput = document.getElementById("name");
                const emailInput = document.getElementById("email");

                const bookingData = {
                    name: nameInput.value,
                    email: emailInput.value,
                    package: packageSelect.value,
                    travelers: travelersInput.value,
                    total: totalSpan.textContent,
                    date: new Date().toISOString(),
                    status: 'Pending Payment',
                    userEmail: emailInput.value // Default to input email
                };

                // Link to user account if logged in
                const user = Auth.getCurrentUser();
                if (user) {
                    bookingData.userEmail = user.email;
                }

                localStorage.setItem("pendingBooking", JSON.stringify(bookingData));

                const bookingModal = bootstrap.Modal.getInstance(document.getElementById("bookingModal"));
                if (bookingModal) bookingModal.hide();

                const isPagesDir = window.location.pathname.includes('/pages/');
                window.location.href = isPagesDir ? 'payment.html' : 'pages/payment.html';
            });
        }
        
         // Cancel Offer
        const cancelOfferBtn = document.getElementById("cancelOfferBtn");
        if (cancelOfferBtn) {
            cancelOfferBtn.addEventListener("click", () => {
                this.isDiscountApplied = false;
                this.updatePrice();
            });
        }
    },

    updatePrice: function () {
        const packageSelect = document.getElementById("package");
        const travelersInput = document.getElementById("travelers");
        const packagePriceDiv = document.getElementById("packagePrice");
        const totalAmountSpan = document.getElementById("totalAmount");
        const originalTotalAmountSpan = document.getElementById("originalTotalAmount");
        const cancelOfferBtn = document.getElementById("cancelOfferBtn");

        if (!packageSelect || !travelersInput) return;

        const selectedPackage = packageSelect.value;
        const numTravelers = parseInt(travelersInput.value) || 0;
        const pricePerPerson = this.packagePrices[selectedPackage] || 0;

        if (packagePriceDiv) packagePriceDiv.textContent = "₹" + pricePerPerson.toLocaleString();

        let total = pricePerPerson * numTravelers;

        if (this.isDiscountApplied) {
            const discountedTotal = total * (1 - this.discountRate);
            if (originalTotalAmountSpan) {
                originalTotalAmountSpan.textContent = "₹" + total.toLocaleString();
                originalTotalAmountSpan.classList.remove("d-none");
            }
            if (totalAmountSpan) totalAmountSpan.textContent = "₹" + discountedTotal.toLocaleString();
            if (cancelOfferBtn) cancelOfferBtn.classList.remove("d-none");
        } else {
            if (originalTotalAmountSpan) originalTotalAmountSpan.classList.add("d-none");
            if (totalAmountSpan) totalAmountSpan.textContent = "₹" + total.toLocaleString();
            if (cancelOfferBtn) cancelOfferBtn.classList.add("d-none");
        }
    },
};

// --- Payment Module ---
const Payment = {
    init: function() {
        if(!document.getElementById('paymentTabsContent')) return;
        this.loadOrderSummary();
        this.bindEvents();
    },

    loadOrderSummary: function() {
        const pendingBooking = JSON.parse(localStorage.getItem('pendingBooking'));
        if(!pendingBooking) {
            alert("No pending booking found. Redirecting to home.");
            window.location.href = "../index.html";
            return;
        }

        document.getElementById('summaryPackage').textContent = pendingBooking.package;
        document.getElementById('summaryTravelers').textContent = pendingBooking.travelers;
        document.getElementById('summaryTotal').textContent = pendingBooking.total;
        
        const amount = pendingBooking.total.replace(/[^0-9.]/g, '');
        const upiId = '7038948696';
        const upiName = 'MaharajaTravels';
        
        const upiData = `upi://pay?pa=${upiId}@upi&pn=${upiName}&am=${amount}&cu=INR`;
        const encodedData = encodeURIComponent(upiData);
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedData}`;
        
        const qrImg = document.getElementById('upiQrCode');
        if(qrImg) qrImg.src = qrApiUrl;
    },

    bindEvents: function() {
        const paymentForm = document.getElementById("paymentForm");
        const upiForm = document.getElementById("upiForm");
        
        if(paymentForm) {
            paymentForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.processPayment("Card");
            });
        }
        
        if(upiForm) {
            upiForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.processPayment("UPI");
            });
        }
        
        const cardInput = document.getElementById('cardNumber');
        if(cardInput) {
            cardInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').substring(0, 16);
            });
        }
        
        const cvvInput = document.getElementById('cvv');
        if(cvvInput) {
            cvvInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
            });
        }

        // Use event delegation for history button as it might be dynamically added
        document.addEventListener("click", (e) => {
            if (e.target && e.target.id === "historyBtn") {
                e.preventDefault();
                this.showHistory();
            }
        });
    },

    processPayment: function(method) {
        let submitBtn = (method === "Card") ? 
            document.querySelector('#paymentForm button[type="submit"]') : 
            document.querySelector('#upiForm button[type="submit"]');
        
        submitBtn.disabled = true;
        submitBtn.textContent = "Processing...";

        setTimeout(() => {
            alert(`Payment Successful via ${method}! Your booking is confirmed.`);
            
            const pendingBooking = JSON.parse(localStorage.getItem('pendingBooking'));

            if(pendingBooking) {
                pendingBooking.status = 'Confirmed';
                pendingBooking.paymentId = 'TXN' + Date.now();
                pendingBooking.method = method;
                pendingBooking.date = new Date().toLocaleDateString();
                
                // Use Database Module for persistence
                Database.Bookings.add(pendingBooking);
                
                localStorage.removeItem('pendingBooking');
            }

            submitBtn.textContent = "Success!";
            window.location.href = "../index.html";
        }, 2000);
    },

    showHistory: function() {
        // Updated to act as a fallback logic, or used on specific pages
        const user = Auth.getCurrentUser();

        let historyModal = document.getElementById('historyModal');
        if (!historyModal) {
             const title = user ? "My Bookings" : "Guest Bookings";
            const modalHTML = `
            <div class="modal fade" id="historyModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Package</th>
                                            <th>Travelers</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody id="historyTableBody"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            historyModal = document.getElementById('historyModal');
        }

        Database.Bookings.getByUser(user ? user.email : null).then(displayBookings => {
            const tbody = document.getElementById('historyTableBody');
            tbody.innerHTML = '';

            if (displayBookings.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">No bookings found.</td></tr>';
            } else {
                displayBookings.forEach(booking => {
                    const row = `
                        <tr>
                            <td>${booking.date || '-'}</td>
                            <td>${booking.package}</td>
                            <td>${booking.travelers}</td>
                            <td>${booking.total}</td>
                            <td><span class="badge bg-success">${booking.status}</span></td>
                        </tr>
                    `;
                    tbody.insertAdjacentHTML('beforeend', row);
                });
            }

            const modal = new bootstrap.Modal(historyModal);
            modal.show();
        });
    }
};

// --- Forms Helper Module ---
const Forms = {
    init: function () {
        const contactForms = document.querySelectorAll("section.contact-form form");
        contactForms.forEach((form) => {
            if (form.id === "bookingForm") return; 
            if (form.id === "paymentForm") return; 
            if (form.id === "loginForm") return;
            if (form.id === "registerForm") return;

            form.addEventListener("submit", (e) => {
                e.preventDefault();
                alert("Message Sent! We will get back to you soon.");
                form.reset();
            });
        });
    },
};

// --- UI Utility Module ---
const UI = {
    init: function() {
        this.updateYear();
    },

    updateYear: function () {
        const yearSpan = document.getElementById("year");
        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear();
        }
    }
};
