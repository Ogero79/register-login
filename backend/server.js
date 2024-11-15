const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');
const client = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    process.env.CORS_ORIGIN,           // Local dev React frontend
    'https://your-frontend-domain.com' // Production React frontend
  ];

  const corsOptions = {
    origin: (origin, callback) => {
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        // Allow the request if origin is in the list or no origin (like from Postman)
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
  };

// Use CORS middleware
app.use(cors(corsOptions));

// Middleware to parse JSON request bodies
app.use(express.json());

// Set up session middleware
app.use(session({
  secret: process.env.SESSION_SECRET, // Change this to a secure secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true } // Use true if you're using HTTPS
}));

// User Registration API
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user into the database
  const query = 'INSERT INTO users(email, password) VALUES($1, $2) RETURNING id, email';
  const values = [email, hashedPassword];

  try {
    const result = await client.query(query, values);
    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error inserting user', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// User Login API with session
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const query = 'SELECT * FROM users WHERE email = $1';
  const values = [email];

  try {
    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    // Compare hashed password with entered password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Store user information in the session
    req.session.userId = user.id;
    req.session.email = user.email;

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Error during login', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// User Logout API
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }

    res.status(200).json({ message: 'Logged out successfully' });
  });
});

// Protected route example (for home)
app.get('/home', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'You must be logged in to view this page' });
  }

  res.status(200).json({ message: 'Welcome to the home page!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
