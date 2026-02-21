require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use("/pages", express.static(path.join(__dirname, "pages")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL: Supabase URL or Key missing in .env file");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Auth Endpoints ---

// Register
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Registration successful", user: data.user });
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(400).json({ error: error.message });
  res.json({
    message: "Login successful",
    session: data.session,
    user: data.user,
  });
});

// --- Booking Endpoints ---

// Add a booking
app.post("/api/bookings", async (req, res) => {
  const booking = req.body;

  const { data, error } = await supabase.from("bookings").insert([
    {
      id: booking.id,
      name: booking.name,
      email: booking.email,
      package: booking.package,
      travelers: parseInt(booking.travelers),
      total: booking.total,
      date: booking.date,
      status: booking.status,
      user_email: booking.userEmail,
      payment_id: booking.paymentId,
      method: booking.method,
    },
  ]);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Booking saved", data });
});

// Get bookings by email or all
app.get("/api/bookings", async (req, res) => {
  const email = req.query.email;

  let query = supabase.from("bookings").select("*");
  if (email) {
    query = query.eq("user_email", email);
  }

  const { data, error } = await query;

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
