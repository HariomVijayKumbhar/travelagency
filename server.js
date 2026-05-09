require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(process.cwd()));
app.use("/pages", express.static(path.join(process.cwd(), "pages")));
app.use("/assets", express.static(path.join(process.cwd(), "assets")));

// Root handler to serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "index.html"));
});

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL: Supabase URL or Key missing in .env file");
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// --- Auth Endpoints ---

// Register
app.post("/api/auth/register", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
  const { email, password, name, redirectTo } = req.body;

  // Try the two-argument signUp form (credentials, options).
  // Include both `redirectTo` and `emailRedirectTo` to support different
  // supabase-js versions / API shapes so the confirmation email returns
  // to the provided URL.
  const { data, error } = await supabase.auth.signUp(
    { email, password },
    {
      data: { full_name: name },
      redirectTo: redirectTo,
      emailRedirectTo: redirectTo,
    }
  );

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Registration successful", user: data.user });
});

// Login
app.post("/api/auth/login", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
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
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
  const booking = req.body;
  const bookingId = booking.id || `BK${Date.now()}`;

  const { data, error } = await supabase.from("bookings").insert([
    {
      id: bookingId,
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
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
  const email = req.query.email;

  let query = supabase.from("bookings").select("*");
  if (email) {
    query = query.eq("user_email", email);
  }

  const { data, error } = await query;

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// --- Profile Endpoints ---

// Create or update profile
app.post("/api/profiles", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
  const profile = req.body;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      [
        {
          user_id: profile.userId || null,
          full_name: profile.fullName,
          email: profile.email,
          avatar_url: profile.avatarUrl,
          phone: profile.phone,
          address: profile.address,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "email" }
    )
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Profile saved", data });
});

// Get profile by email
app.get("/api/profiles/:email", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
  const email = req.params.email;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json(data?.[0] || null);
});

// Update profile
app.put("/api/profiles/:email", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
  const email = req.params.email;
  const profile = req.body;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      [
        {
          email,
          full_name: profile.fullName,
          avatar_url: profile.avatarUrl,
          phone: profile.phone,
          address: profile.address,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "email" }
    )
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Profile updated", data });
});

// --- Package Endpoints ---

// Get all packages
app.get("/api/packages", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

  const { data, error } = await supabase.from("packages").select("*");

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Get single package
app.get("/api/packages/:id", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
  const id = req.params.id;

  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Create package
app.post("/api/packages", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
  const pkg = req.body;

  const { data, error } = await supabase.from("packages").insert([
    {
      name: pkg.name,
      destination: pkg.destination,
      description: pkg.description,
      price: parseFloat(pkg.price),
      duration: parseInt(pkg.duration),
      images: pkg.images || [],
      highlights: pkg.highlights || [],
      best_time: pkg.bestTime,
    },
  ]).select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Package created", data });
});

// --- Review Endpoints ---

// Get all reviews
app.get("/api/reviews", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

  const { data, error } = await supabase.from("reviews").select("*");

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Get reviews by destination
app.get("/api/reviews/destination/:destination", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
  const destination = req.params.destination;

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("destination", destination);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Create review
app.post("/api/reviews", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured" });
  const review = req.body;

  const { data, error } = await supabase.from("reviews").insert([
    {
      id: review.id || undefined,
      booking_id: review.bookingId,
      user_email: review.userEmail,
      rating: parseInt(review.rating),
      comment: review.comment,
      destination: review.destination,
    },
  ]).select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Review saved", data });
});

// For Vercel, we export the app
module.exports = app;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
