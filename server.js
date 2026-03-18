const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB().catch(err => {
  console.error("Database connection failed:", err.message);
});

// For Render and general web services, we MUST call app.listen
// Vercel can handle the exported app, but even on Vercel calling listen often doesn't hurt.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server is running on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});

// Export the express app so Vercel can run it as a Serverless Function
module.exports = app;
