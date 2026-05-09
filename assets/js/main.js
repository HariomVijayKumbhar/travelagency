/**
 * Maharaja Travels - Main JavaScript Logic
 * Handles Authentication, Booking, Search, and UI Interactions
 */

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

// --- Authentication Module ---
const Auth = {
    init: function () {
        this.updateUI();
        this.bindEvents();
    },

    bindEvents: function () {
        document.body.addEventListener('submit', (e) => {
            if (e.target && e.target.id === 'loginPageForm') {
                e.preventDefault();
                this.login();
            }
            if (e.target && e.target.id === 'registerPageForm') {
                e.preventDefault();
                this.register();
            }
        });

        document.addEventListener("click", (e) => {
            if (e.target && (e.target.id === "logoutBtn" || e.target.id === "logoutBtnNav")) {
                e.preventDefault();
                this.logout();
            }
            if (e.target && e.target.id === "historyBtn") {
                e.preventDefault();
                Payment.showHistory();
            }
        });
    },

    register: async function () {
        const name = document.getElementById("registerName").value;
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("registerConfirmPassword").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const redirectTo = `${window.location.origin}/pages/login.html`;
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, redirectTo })
            });

            const result = await response.json();

            if (response.ok) {
                alert("Registration Successful! Welcome to Maharaja Travels.");
                window.location.href = "login.html";
            } else {
                alert("Registration failed: " + result.error);
            }
        } catch (error) {
            console.error("Registration error:", error);
            alert("An error occurred during registration. Please check if the server is running.");
        }
    },

    login: async function () {
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem("currentUser", JSON.stringify({
                    name: result.user.user_metadata.full_name || result.user.email,
                    email: result.user.email,
                    id: result.user.id
                }));
                localStorage.setItem("supabaseSession", JSON.stringify(result.session));
                
                alert(`Welcome back, ${result.user.user_metadata.full_name || result.user.email}!`);
                window.location.href = "../index.html";
            } else {
                alert("Login failed: " + result.error);
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("An error occurred during login. Please check if the server is running.");
        }
    },

    logout: function () {
        if (confirm("Are you sure you want to logout?")) {
            localStorage.removeItem("currentUser");
            if (window.location.pathname.includes('profile.html')) {
                window.location.href = "../index.html";
            } else {
                this.updateUI();
                window.location.reload();
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
        if (!navList) return;

        const user = this.getCurrentUser();
        const existingAuthItems = document.querySelectorAll(".auth-item");
        if (!window.location.pathname.includes('profile.html')) {
             existingAuthItems.forEach((el) => el.remove());
        }

        const staticLinks = document.querySelectorAll('.auth-link');

        if (user) {
            staticLinks.forEach(link => {
                if(link.parentElement) link.parentElement.style.display = 'none';
            });

            if (!window.location.pathname.includes('profile.html')) {
                const userItem = `
                    <li class="nav-item auth-item dropdown">
                        <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" class="nav-avatar" alt="Profile">
                            ${user.name}
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                            <li><a class="dropdown-item" href="#" id="logoutBtn">Logout</a></li>
                        </ul>
                    </li>
                `;
                navList.insertAdjacentHTML("beforeend", userItem);
            }
            
        } else {
            staticLinks.forEach(link => {
                if(link.parentElement) link.parentElement.style.display = '';
            });
            if (window.location.pathname.includes('profile.html')) {
                window.location.href = "login.html";
            }
        }
    },
};

// --- Profile Module ---
const Profile = {
    currentBooking: null,

    init: function() {
        if (!window.location.pathname.includes('profile.html')) return;
        const user = Auth.getCurrentUser();
        if (!user) {
            window.location.href = "login.html";
            return;
        }
        this.loadUserData(user);
        this.loadBookings(user.email);
        this.bindReviewEvents();
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
                    const bookingDate = booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A';
                    const statusColor = booking.status === 'Confirmed' ? 'success' : (booking.status === 'Pending Payment' ? 'warning' : 'danger');
                    const row = `
                        <tr>
                            <td>
                                <small class="text-muted">${booking.id ? booking.id.substring(0, 8) : '-'}</small>
                            </td>
                            <td>
                                <div class="fw-bold">${bookingDate}</div>
                            </td>
                            <td>
                                <div class="fw-bold text-primary">${booking.package}</div>
                            </td>
                            <td>
                                <span class="badge bg-info">${booking.travelers} Person${booking.travelers > 1 ? 's' : ''}</span>
                            </td>
                            <td>
                                <div class="fw-bold">${booking.total}</div>
                            </td>
                            <td>
                                <small class="text-muted">${booking.method || 'Pending'}</small>
                            </td>
                            <td>
                                <span class="badge bg-${statusColor} rounded-pill">
                                    ${booking.status}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary view-details-btn" data-booking-id="${booking.id}" title="View Details">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-warning write-review-btn" data-booking-id="${booking.id}" data-package="${booking.package}" title="Write Review">
                                    <i class="fas fa-star"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                    tbody.insertAdjacentHTML('beforeend', row);
                });

                // Add event listeners to the newly created buttons
                document.querySelectorAll('.view-details-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const bookingId = btn.getAttribute('data-booking-id');
                        const booking = bookings.find(b => b.id === bookingId);
                        if(booking) Profile.showBookingDetails(booking);
                    });
                });

                document.querySelectorAll('.write-review-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const bookingId = btn.getAttribute('data-booking-id');
                        const packageName = btn.getAttribute('data-package');
                        const booking = bookings.find(b => b.id === bookingId);
                        if(booking) Profile.showReviewModal(booking, packageName);
                    });
                });
            }
        });
    },

    showBookingDetails: function(booking) {
        const content = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="text-secondary">Booking ID</h6>
                    <p class="fw-bold">${booking.id}</p>
                </div>
                <div class="col-md-6">
                    <h6 class="text-secondary">Status</h6>
                    <p><span class="badge bg-${booking.status === 'Confirmed' ? 'success' : 'warning'}">${booking.status}</span></p>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <h6 class="text-secondary">Package</h6>
                    <p class="fw-bold">${booking.package}</p>
                </div>
                <div class="col-md-6">
                    <h6 class="text-secondary">Number of Travelers</h6>
                    <p class="fw-bold">${booking.travelers}</p>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <h6 class="text-secondary">Travel Date</h6>
                    <p class="fw-bold">${booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <h6 class="text-secondary">Booking Date</h6>
                    <p class="fw-bold">${booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <h6 class="text-secondary">Total Amount</h6>
                    <p class="fw-bold h5 text-primary">${booking.total}</p>
                </div>
                <div class="col-md-6">
                    <h6 class="text-secondary">Payment Method</h6>
                    <p class="fw-bold">${booking.method || 'Pending'}</p>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <h6 class="text-secondary">Guest Information</h6>
                    <p class="fw-bold">${booking.name}</p>
                    <p class="text-muted">${booking.email}</p>
                </div>
            </div>
            ${booking.payment_id ? `
                <div class="row">
                    <div class="col-12">
                        <h6 class="text-secondary">Payment ID</h6>
                        <p class="fw-bold">${booking.payment_id}</p>
                    </div>
                </div>
            ` : ''}
        `;
        
        document.getElementById('bookingDetailsContent').innerHTML = content;
        const modal = new bootstrap.Modal(document.getElementById('bookingDetailsModal'));
        modal.show();
    },

    showReviewModal: function(booking, packageName) {
        Profile.currentBooking = booking;
        document.getElementById('reviewDestination').value = packageName;
        document.getElementById('reviewRating').value = '0';
        document.getElementById('reviewComment').value = '';
        document.querySelectorAll('.star').forEach(star => star.classList.remove('active'));
        
        const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
        modal.show();
    },

    bindReviewEvents: function() {
        const ratingStars = document.querySelectorAll('#ratingStars .star');
        ratingStars.forEach(star => {
            star.addEventListener('click', function() {
                const rating = this.getAttribute('data-rating');
                document.getElementById('reviewRating').value = rating;
                ratingStars.forEach((s, index) => {
                    if(index < rating) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
            });
            
            star.addEventListener('mouseenter', function() {
                const hoverRating = this.getAttribute('data-rating');
                ratingStars.forEach((s, index) => {
                    if(index < hoverRating) {
                        s.style.color = '#ffc107';
                    } else {
                        s.style.color = '#ddd';
                    }
                });
            });
        });

        document.getElementById('ratingStars').addEventListener('mouseleave', function() {
            const currentRating = document.getElementById('reviewRating').value;
            ratingStars.forEach((s, index) => {
                if(index < currentRating) {
                    s.style.color = '#ffc107';
                } else {
                    s.style.color = '#ddd';
                }
            });
        });

        const reviewForm = document.getElementById('reviewForm');
        if(reviewForm) {
            reviewForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const rating = document.getElementById('reviewRating').value;
                if(!rating || rating === '0') {
                    alert('Please select a rating');
                    return;
                }

                const review = {
                    bookingId: Profile.currentBooking.id,
                    userEmail: Profile.currentBooking.email,
                    rating: parseInt(rating),
                    comment: document.getElementById('reviewComment').value,
                    destination: document.getElementById('reviewDestination').value
                };

                try {
                    const response = await fetch('/api/reviews', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(review)
                    });

                    const result = await response.json();
                    
                    if(response.ok) {
                        alert('Thank you for your review!');
                        bootstrap.Modal.getInstance(document.getElementById('reviewModal')).hide();
                    } else {
                        alert('Failed to submit review: ' + (result.error || 'Unknown error'));
                    }
                } catch (error) {
                    console.error('Review submission error:', error);
                    alert('An error occurred while submitting your review.');
                }
            });
        }
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

// --- Offer Module ---
const Offer = {
    init: function() {
        this.checkClaimedOffer();
    },
    checkClaimedOffer: function() {
        const claimedOffer = JSON.parse(localStorage.getItem("claimedOffer"));
        if (claimedOffer) {
            console.log("Claimed Offer found:", claimedOffer);
        }
    },
    getClaimedOffer: function() {
        return JSON.parse(localStorage.getItem("claimedOffer"));
    },
    clearClaimedOffer: function() {
        localStorage.removeItem("claimedOffer");
    }
};

// --- Booking Module ---
const Booking = {
    packagePrices: {
        "Standard Package": 8500,
        "Premium Package": 12500,
        "Luxury Package": 18000,
        "Custom Package": 0,
    },
    discountRate: 0,
    isDiscountApplied: false,
    appliedOffer: null,
    formState: {
        submitted: false,
    },

    init: function () {
        this.bindEvents();
        this.setupValidation();
        const claimed = Offer.getClaimedOffer();
        if (claimed) {
            this.appliedOffer = claimed;
            this.discountRate = claimed.discount / 100;
            this.isDiscountApplied = true;
        }
    },

    setupValidation: function () {
        const form = document.getElementById("bookingForm");
        if (!form) return;

        this.bookingForm = form;
        this.bookingSubmitBtn = form.querySelector('button[type="submit"]');
        this.bookingFields = {
            name: document.getElementById("name"),
            email: document.getElementById("email"),
            phone: document.getElementById("phone"),
            travelers: document.getElementById("travelers"),
            checkin: document.getElementById("checkin"),
            checkout: document.getElementById("checkout"),
            package: document.getElementById("package"),
        };

        const phoneInput = this.bookingFields.phone;
        if (phoneInput) {
            phoneInput.type = "text";
            phoneInput.inputMode = "numeric";
            phoneInput.autocomplete = "tel";
            phoneInput.maxLength = 10;
            phoneInput.placeholder = "Enter 10-digit mobile number";
        }

        this.ensureBookingFeedback(this.bookingFields.phone);
        this.ensureBookingFeedback(this.bookingFields.checkin);
        this.ensureBookingFeedback(this.bookingFields.checkout);

        this.syncDateConstraints();

        const markTouched = (event) => {
            if (event.target && event.target.classList) {
                event.target.dataset.touched = "true";
            }
        };

        form.addEventListener("input", (event) => {
            markTouched(event);
            if (event.target && event.target.id === "phone") {
                this.sanitizePhoneInput(event.target);
            }
            if (event.target && event.target.id === "checkin") {
                this.syncDateConstraints();
            }
            this.validateBookingForm();
        });

        form.addEventListener("change", (event) => {
            markTouched(event);
            if (event.target && event.target.id === "checkin") {
                this.syncDateConstraints();
            }
            this.validateBookingForm();
        });

        this.validateBookingForm();
    },

    getLocalDateValue: function (date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    },

    shiftDateValue: function (dateValue, days) {
        if (!dateValue) return "";
        const shifted = new Date(`${dateValue}T00:00:00`);
        shifted.setDate(shifted.getDate() + days);
        return this.getLocalDateValue(shifted);
    },

    sanitizePhoneInput: function (input) {
        if (!input) return;
        const digitsOnly = input.value.replace(/\D/g, "").slice(0, 10);
        if (input.value !== digitsOnly) {
            input.value = digitsOnly;
        }
    },

    ensureBookingFeedback: function (input) {
        if (!input || input.nextElementSibling?.classList?.contains("booking-feedback")) return;
        const feedback = document.createElement("div");
        feedback.className = "invalid-feedback booking-feedback";
        feedback.setAttribute("aria-live", "polite");
        input.insertAdjacentElement("afterend", feedback);
    },

    setFieldState: function (input, isValid, message) {
        if (!input) return;
        const shouldShowState = input.dataset.touched === "true" || this.formState.submitted;
        const feedback = input.nextElementSibling?.classList?.contains("booking-feedback")
            ? input.nextElementSibling
            : null;

        input.setCustomValidity(isValid ? "" : (message || "Invalid value"));

        if (!shouldShowState) {
            input.classList.remove("is-valid", "is-invalid");
            if (feedback) feedback.textContent = "";
            return;
        }

        input.classList.toggle("is-valid", isValid);
        input.classList.toggle("is-invalid", !isValid);

        if (feedback) {
            feedback.textContent = isValid ? "" : message;
        }
    },

    syncDateConstraints: function () {
        const checkinInput = this.bookingFields?.checkin;
        const checkoutInput = this.bookingFields?.checkout;
        if (!checkinInput || !checkoutInput) return;

        const today = this.getLocalDateValue();
        checkinInput.min = today;

        if (checkinInput.value && checkinInput.value < today) {
            checkinInput.value = today;
        }

        const nextAllowedCheckout = checkinInput.value
            ? this.shiftDateValue(checkinInput.value, 1)
            : this.shiftDateValue(today, 1);

        checkoutInput.min = nextAllowedCheckout;

        if (checkoutInput.value && checkoutInput.value <= (checkinInput.value || today)) {
            checkoutInput.value = nextAllowedCheckout;
        }
    },

    validateBookingForm: function () {
        const fields = this.bookingFields || {};
        const today = this.getLocalDateValue();
        const checkinValue = fields.checkin?.value || "";
        const checkoutValue = fields.checkout?.value || "";
        const travelersValue = parseInt(fields.travelers?.value, 10);
        const phoneDigits = (fields.phone?.value || "").replace(/\D/g, "");

        if (fields.phone) this.sanitizePhoneInput(fields.phone);

        const validations = [
            {
                input: fields.name,
                valid: !!fields.name?.value.trim(),
                message: "Enter your full name.",
            },
            {
                input: fields.email,
                valid: !!fields.email?.value && fields.email.checkValidity(),
                message: "Enter a valid email address.",
            },
            {
                input: fields.phone,
                valid: phoneDigits.length === 10,
                message: "Phone number must be exactly 10 digits.",
            },
            {
                input: fields.travelers,
                valid: Number.isInteger(travelersValue) && travelersValue >= 1,
                message: "Enter at least 1 traveler.",
            },
            {
                input: fields.package,
                valid: !!fields.package?.value,
                message: "Select a package.",
            },
            {
                input: fields.checkin,
                valid: !!checkinValue && checkinValue >= today,
                message: "Check-in date cannot be in the past.",
            },
            {
                input: fields.checkout,
                valid: !!checkoutValue && !!checkinValue && checkoutValue > checkinValue,
                message: "Check-out date must be after check-in date.",
            },
        ];

        validations.forEach(({ input, valid, message }) => {
            this.setFieldState(input, valid, message);
        });

        const isFormValid = validations.every((entry) => entry.valid);
        if (this.bookingSubmitBtn) {
            this.bookingSubmitBtn.disabled = !isFormValid;
        }

        return isFormValid;
    },

    bindEvents: function () {
        const buttons = document.querySelectorAll(".book-now");
        buttons.forEach((button) => {
            button.addEventListener("click", (e) => {
                e.preventDefault();
                if (!Auth.isLoggedIn()) {
                    alert("Please login to book a trip.");
                    window.location.href = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
                    return;
                }
                const user = Auth.getCurrentUser();
                const claimed = Offer.getClaimedOffer();
                if (claimed) {
                    this.appliedOffer = claimed;
                    this.discountRate = claimed.discount / 100;
                    this.isDiscountApplied = true;
                }
                const packageName = e.target.getAttribute("data-package");
                const packageSelect = document.getElementById("package");
                if (packageSelect) {
                    packageSelect.value = packageName;
                    this.updatePrice();
                }
                const nameInput = document.getElementById("name");
                const emailInput = document.getElementById("email");
                if (nameInput) nameInput.value = user ? user.name : "";
                if (emailInput) emailInput.value = user ? user.email : "";

                const bookingModalEl = document.getElementById("bookingModal");
                if (bookingModalEl) {
                    const bookingModal = new bootstrap.Modal(bookingModalEl);
                    bookingModal.show();
                }
            });
        });

        const packageSelect = document.getElementById("package");
        const travelersInput = document.getElementById("travelers");
        if (packageSelect) packageSelect.addEventListener("change", () => this.updatePrice());
        if (travelersInput) travelersInput.addEventListener("input", () => this.updatePrice());

        const bookingForm = document.getElementById("bookingForm");
        if (bookingForm) {
            bookingForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.formState.submitted = true;

                if (!this.validateBookingForm()) {
                    const firstInvalid = bookingForm.querySelector(".is-invalid");
                    if (firstInvalid && typeof firstInvalid.focus === "function") {
                        firstInvalid.focus();
                    }
                    return;
                }

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
                    baseTotal: (this.packagePrices[packageSelect.value] || 0) * (parseInt(travelersInput.value) || 0),
                    date: new Date().toISOString(),
                    status: 'Pending Payment',
                    userEmail: emailInput.value,
                    appliedOffer: this.appliedOffer
                };

                const user = Auth.getCurrentUser();
                if (user) bookingData.userEmail = user.email;

                localStorage.setItem("pendingBooking", JSON.stringify(bookingData));
                const bookingModal = bootstrap.Modal.getInstance(document.getElementById("bookingModal"));
                if (bookingModal) bookingModal.hide();

                const isPagesDir = window.location.pathname.includes('/pages/');
                window.location.href = isPagesDir ? 'payment.html' : 'pages/payment.html';
            });
        }
    },

    updatePrice: function () {
        const packageSelect = document.getElementById("package");
        const travelersInput = document.getElementById("travelers");
        const packagePriceDiv = document.getElementById("packagePrice");
        const totalAmountSpan = document.getElementById("totalAmount");
        const originalTotalAmountSpan = document.getElementById("originalTotalAmount");
        const offerBadge = document.getElementById("offerBadge");

        if (!packageSelect || !travelersInput) return;

        const selectedPackage = packageSelect.value;
        const numTravelers = parseInt(travelersInput.value) || 0;
        const pricePerPerson = this.packagePrices[selectedPackage] || 0;
        if (packagePriceDiv) packagePriceDiv.textContent = "₹" + pricePerPerson.toLocaleString();

        let total = pricePerPerson * numTravelers;

        if (this.isDiscountApplied && this.appliedOffer) {
            const discountedTotal = total * (1 - this.discountRate);
            if (originalTotalAmountSpan) {
                originalTotalAmountSpan.textContent = "₹" + total.toLocaleString();
                originalTotalAmountSpan.classList.remove("d-none");
            }
            if (totalAmountSpan) totalAmountSpan.textContent = "₹" + Math.round(discountedTotal).toLocaleString();
            if (offerBadge) {
                offerBadge.textContent = `${this.appliedOffer.name} Applied (${this.appliedOffer.discount}%)`;
                offerBadge.classList.remove("d-none");
            }
        } else {
            if (originalTotalAmountSpan) originalTotalAmountSpan.classList.add("d-none");
            if (totalAmountSpan) totalAmountSpan.textContent = "₹" + total.toLocaleString();
            if (offerBadge) offerBadge.classList.add("d-none");
        }
    },
};

// --- Payment Module ---
const Payment = {
    init: function() {
        if(!document.getElementById('card-tab')) return;
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
        document.getElementById('summaryTravelers').textContent = `${pendingBooking.travelers} Persons`;
        this.updatePaymentSummary(pendingBooking);
        
        const amount = pendingBooking.total.replace(/[^0-9.]/g, '');
        const upiId = '7038948696';
        const upiName = 'MaharajaTravels';
        const upiData = `upi://pay?pa=${upiId}@upi&pn=${upiName}&am=${amount}&cu=INR`;
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiData)}`;
        const qrImg = document.getElementById('upiQrCode');
        if(qrImg) qrImg.src = qrApiUrl;
    },

    updatePaymentSummary: function(booking) {
        const baseAmountEl = document.getElementById('baseAmount');
        const offerRow = document.getElementById('offerRow');
        const appliedOfferName = document.getElementById('appliedOfferName');
        const discountAmountEl = document.getElementById('discountAmount');
        const summaryTotalEl = document.getElementById('summaryTotal');

        const baseAmount = booking.baseTotal || 0;
        let total = baseAmount;
        if (baseAmountEl) baseAmountEl.textContent = "₹" + baseAmount.toLocaleString();

        if (booking.appliedOffer) {
            const discount = Math.round(baseAmount * (booking.appliedOffer.discount / 100));
            total = baseAmount - discount;
            if (offerRow) offerRow.classList.remove('d-none');
            if (appliedOfferName) appliedOfferName.textContent = booking.appliedOffer.name;
            if (discountAmountEl) discountAmountEl.textContent = "-₹" + discount.toLocaleString();
            document.querySelectorAll('.offer-item').forEach(item => {
                if(item.getAttribute('data-offer-id') === booking.appliedOffer.id) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        } else {
            if (offerRow) offerRow.classList.add('d-none');
            document.querySelectorAll('.offer-item').forEach(item => item.classList.remove('active'));
        }
        if (summaryTotalEl) summaryTotalEl.textContent = "₹" + Math.round(total).toLocaleString();
        booking.total = "₹" + Math.round(total).toLocaleString();
        localStorage.setItem('pendingBooking', JSON.stringify(booking));
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

        const offerItems = document.querySelectorAll('.offer-item');
        offerItems.forEach(item => {
            item.addEventListener('click', () => {
                const pendingBooking = JSON.parse(localStorage.getItem('pendingBooking'));
                const offerId = item.getAttribute('data-offer-id');
                const discount = parseInt(item.getAttribute('data-discount'));
                const name = item.querySelector('h6').textContent;
                if (pendingBooking.appliedOffer && pendingBooking.appliedOffer.id === offerId) {
                    delete pendingBooking.appliedOffer;
                } else {
                    pendingBooking.appliedOffer = { id: offerId, discount, name };
                }
                this.updatePaymentSummary(pendingBooking);
            });
        });

        ['cardNumber', 'cvv', 'upiId'].forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.addEventListener('input', (e) => {
                    e.target.value = e.target.value.replace(/\D/g, '');
                });
            }
        });
    },

    processPayment: async function(method) {
        const submitBtn = method === "Card" ? document.getElementById('cardPayBtn') : document.getElementById('upiPayBtn');
        if (!submitBtn) return;
        submitBtn.disabled = true;
        submitBtn.textContent = "Processing...";

        setTimeout(async () => {
            const pendingBooking = JSON.parse(localStorage.getItem('pendingBooking'));
            if(pendingBooking) {
                pendingBooking.status = 'Confirmed';
                pendingBooking.paymentId = 'TXN' + Date.now();
                pendingBooking.method = method;
                pendingBooking.date = new Date().toLocaleDateString();
                try {
                    await Database.Bookings.add(pendingBooking);
                    localStorage.removeItem('pendingBooking');
                    Offer.clearClaimedOffer();
                } catch (error) {
                    console.error("Failed to save booking:", error);
                    alert("Payment was processed, but the booking could not be saved. Please try again.");
                    submitBtn.disabled = false;
                    submitBtn.textContent = method === "Card" ? "Pay Now" : "Verify & Confirm";
                    return;
                }
            }
            alert(`Payment Successful! Your journey with Maharaja Travels begins now.`);
            window.location.href = "../index.html";
        }, 2000);
    }
};

// --- Update DOMContentLoaded ---
document.addEventListener("DOMContentLoaded", () => {
    try { 
        Database.init(); 
        DB.init().then(() => {
            try { Auth.init(); } catch (e) {}
            try { Offer.init(); } catch (e) {}
            try { Search.init(); } catch (e) {}
            try { Booking.init(); } catch (e) {}
            try { Payment.init(); } catch (e) {}
            try { Profile.init(); } catch (e) {}
            try { UI.init(); } catch (e) {}
            
            const forms = document.querySelectorAll("form:not(#bookingForm):not(#paymentForm):not(#upiForm):not(#loginPageForm):not(#registerPageForm)");
            forms.forEach(form => {
                form.addEventListener("submit", (e) => {
                    e.preventDefault();
                    alert("Message Sent! We will get back to you soon.");
                    form.reset();
                });
            });
        });
    } catch (e) { console.error("Initialization Failed:", e); }
});

// --- UI Utility Module ---
const UI = {
    init: function() {
        const yearSpan = document.getElementById("year");
        if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    }
};
