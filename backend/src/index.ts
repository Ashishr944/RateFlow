import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import userRoutes from './routes/user';
import ownerRoutes from './routes/owner';

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors({
  origin: '*', // For development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Global Request Logger Middleware
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', req.body);
  }
  if (req.params && Object.keys(req.params).length > 0) {
    console.log('Request Params:', req.params);
  }
  next();
});

// API Route Registration
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/owner', ownerRoutes);

// Root endpoint for browsers and deployment checks
app.get('/', (req, res) => {
  res.json({
    name: 'RateFlow API',
    status: 'ok',
    health: '/health',
    routes: ['/api/auth', '/api/admin', '/api/user', '/api/owner']
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong on the server' });
});

app.listen(PORT, () => {
  console.log(`RateFlow API server running on port ${PORT}`);
});
