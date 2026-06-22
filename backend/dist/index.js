"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const user_1 = __importDefault(require("./routes/user"));
const owner_1 = __importDefault(require("./routes/owner"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// Middlewares
app.use((0, cors_1.default)({
    origin: '*', // For development, allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
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
app.use('/api/auth', auth_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/user', user_1.default);
app.use('/api/owner', owner_1.default);
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
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Something went wrong on the server' });
});
app.listen(PORT, () => {
    console.log(`RateFlow API server running on port ${PORT}`);
});
