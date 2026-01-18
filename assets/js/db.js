/**
 * travelAgencyDB - API Client for SQL backend storage
 */
const DB = {
    baseUrl: 'http://localhost:3000/api',

    init: function() {
        // No client-side init required for SQL backend, 
        // but we keep the method for compatibility with main.js
        console.log("SQL Database client initialized");
        return Promise.resolve();
    },

    /**
     * Add a booking to the SQL database
     * @param {Object} booking 
     */
    addBooking: function(booking) {
        return fetch(`${this.baseUrl}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(booking)
        }).then(response => {
            if (!response.ok) throw new Error('Failed to save booking');
            return response.json();
        });
    },

    /**
     * Get all bookings from the SQL database
     */
    getAllBookings: function() {
        return fetch(`${this.baseUrl}/bookings`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch bookings');
                return response.json();
            });
    },

    /**
     * Get bookings by user email from the SQL database
     * @param {string} email 
     */
    getBookingsByEmail: function(email) {
        const url = email ? `${this.baseUrl}/bookings?email=${encodeURIComponent(email)}` : `${this.baseUrl}/bookings`;
        return fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch user bookings');
                return response.json();
            });
    }
};
