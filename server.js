const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS bookings (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            package TEXT,
            travelers INTEGER,
            total TEXT,
            date TEXT,
            status TEXT,
            userEmail TEXT,
            paymentId TEXT,
            method TEXT
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            }
        });
    }
});

// API Endpoints

// Add a booking
app.post('/api/bookings', (req, res) => {
    const booking = req.body;
    const sql = `INSERT INTO bookings (id, name, email, package, travelers, total, date, status, userEmail, paymentId, method) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        booking.id, booking.name, booking.email, booking.package, 
        booking.travelers, booking.total, booking.date, booking.status, 
        booking.userEmail, booking.paymentId, booking.method
    ];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'Booking saved', id: booking.id });
    });
});

// Get bookings by email or all
app.get('/api/bookings', (req, res) => {
    const email = req.query.email;
    let sql = "SELECT * FROM bookings";
    let params = [];

    if (email) {
        sql += " WHERE userEmail = ?";
        params = [email];
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
