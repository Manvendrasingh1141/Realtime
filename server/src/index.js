require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./db');
const roomRoutes = require('./routes/roomRoutes');
const setupSocketIO = require('./socket');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5001;

// Allowed origins for CORS (Vercel production URL, local vite, etc.)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

// Express middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(null, true); // Permissive CORS for smooth deployment across Vercel previews
    },
    credentials: true,
  })
);

app.use(express.json());

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: '*', // Allow connections from deployed Vercel frontend
    methods: ['GET', 'POST'],
    credentials: false,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Attach io to app so routes can use it if needed
app.set('io', io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/rooms', roomRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Setup Real-Time Socket.IO Handlers
setupSocketIO(io);

// Start Server after connecting to Database
async function startServer() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`[Server] Jugaad messaging server running on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
