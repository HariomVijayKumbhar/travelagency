# Maharaja Travels Agency

A modern, responsive travel agency website built with HTML, CSS, Bootstrap, and JavaScript, powered by a Node.js/Express backend and Supabase for authentication and database management. Features animated backgrounds, real-time user authentication, and a robust booking system.

## Features

- **Responsive Design**: Optimized for all devices using Bootstrap 5.
- **Animated Background**: Custom CSS animations and JavaScript particle effects for an immersive experience.
- **Real-time Authentication**: Secure user login and registration powered by **Supabase Auth**.
- **Booking Management**: Persistent storage for travel bookings using **Supabase Database**.
- **User Profiles**: Personalized user experience with profile management and booking history.
- **Integrated Payment UI**: A dedicated payment interface for a seamless checkout experience.
- **Destination Showcase**: Detailed information and pricing for various travel packages.
- **Search Functionality**: Easily find your favorite destinations.

## Pages

- `index.html` - Homepage with hero section, services, and featured packages.
- `pages/welcome.html` - Welcome page with company overview.
- `pages/offers.html` - Special travel offers and deals.
- `pages/login.html` - Secure user login.
- `pages/register.html` - User registration.
- `pages/profile.html` - User profile and booking history.
- `pages/payment.html` - Booking and payment interface.
- `pages/DENDAL.html`, `pages/GOABEACHES.html`, etc. - Specific destination pages.

## Technologies Used

### Frontend
- HTML5 & CSS3
- Bootstrap 5.3.3
- JavaScript (ES6+)
- Google Fonts (Montserrat)

### Backend
- Node.js
- Express.js
- Supabase (Auth & Database)
- dotenv (Environment management)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.
- A [Supabase](https://supabase.com/) project.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/HariomVijayKumbhar/travelagency.git
   cd travelagency
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   PORT=3005
   ```

### Database Setup

Run the SQL commands provided in `database_schema.sql` in your Supabase SQL Editor to create the necessary tables (`bookings` and `profiles`).

### Running the App

Start the development server:
```bash
npm start
```
The site will be live at `http://localhost:3005`.

## Project Structure

```text
travelagency/
├── assets/
│   ├── css/
│   │   ├── auth.css          # Authentication styles
│   │   ├── munnar.css        # Destination specific styles
│   │   └── style.css         # Global styles
│   ├── images/               # Destination and logo images
│   └── js/
│       ├── db.js             # Supabase client configuration
│       └── main.js           # Core frontend logic
├── pages/
│   ├── login.html            # User login page
│   ├── register.html         # User registration page
│   ├── profile.html          # User profile management
│   ├── payment.html          # Booking & Payment UI
│   ├── offers.html           # Special deals page
│   ├── welcome.html          # Company introduction
│   └── [Destinations].html   # DENDAL, GOABEACHES, MUNNAR, etc.
├── server.js                 # Express Backend Server
├── .env                      # Environment variables
├── database_schema.sql       # Supabase SQL setup script
├── vercel.json               # Vercel deployment configuration
├── index.html                # Project Homepage
├── package.json              # Dependencies and scripts
└── README.md                 # Project documentation
```

## Contact

Maharaja Travels Agency
- Email: MaharajaTravels09@gmail.com
- Phone: +91 8698362024
- Address: Jawaharnagar, Ichalkaranji

---

© 2024 Maharaja Travels Agency. All rights reserved.
