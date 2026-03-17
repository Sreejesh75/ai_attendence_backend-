const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Import routes
const workerRoutes = require('./routes/workerRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Face Detection Attendance API',
      version: '1.0.0',
      description: 'API endpoints for managing workers and tracking automated attendance via AI.'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local development server'
      }
    ]
  },
  apis: [path.join(__dirname, './routes/*.js')], // Paths to files containing swagger annotations
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.3.0/swagger-ui.min.css";

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  customCssUrl: CSS_URL,
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.3.0/swagger-ui-bundle.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.3.0/swagger-ui-standalone-preset.js'
  ]
}));

// API Routes
app.use('/api/workers', workerRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/auth', authRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.send('Attendance API is running. Go to /api-docs for Swagger UI.');
});

// Default Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
