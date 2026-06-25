const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// 1. Direct, explicit package targeting to prevent undefined wrappers
const admin = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');

const app = express();
const PORT = process.env.PORT || 5500;

// ==========================================
// FIREBASE INITIALIZATION
// ==========================================
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

// Initialize the app safely using direct targeting
const firebaseApp = admin.initializeApp({
  credential: admin.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL
});

// Access the database using the clean reference function
const db = getDatabase(firebaseApp);
const reviewsRef = db.ref('reviews');

// ==========================================
// MIDDLEWARE & STATIC FILES
// ==========================================
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
// GET: Fetch all approved reviews from Firebase
app.get('/api/reviews', async (req, res) => {
  try {
    // Querying Firebase to filter only approved reviews
    reviewsRef.orderByChild('status').equalTo('approved').once('value', (snapshot) => {
      const data = snapshot.val() || {};
      
      // Transform JSON object structure into a sorted array (newest first)
      const reviewsList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      reviewsList.sort((a, b) => b.timestamp - a.timestamp);
      
      res.status(200).json(reviewsList);
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews." });
  }
});

// POST: Submit a new review
app.post('/api/reviews', async (req, res) => {
  try {
    const { name, service, rating, comment } = req.body;

    // Server-side basic validation
    if (!name || !service || !rating || !comment) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const newReview = {
      name,
      service,
      rating: parseInt(rating),
      comment,
      timestamp: Date.now(),
      status: "approved" // Change to "pending" if your client prefers manual admin moderation later
    };

    const pushedReviewRef = reviewsRef.push();
    await pushedReviewRef.set(newReview);

    res.status(201).json({ message: "Review submitted successfully!", id: pushedReviewRef.key });
  } catch (error) {
    console.error("Error saving review:", error);
    res.status(500).json({ error: "Failed to save review." });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`⚡ Server running on http://localhost:${PORT}`);
});