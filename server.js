const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB().catch(err => {
  console.error("Database connection failed:", err.message);
});

// Vercel doesn't need app.listen(), it maps requests directly to the exported app
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
    console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
  });
}

// Export the express app so Vercel can run it as a Serverless Function
module.exports = app;
