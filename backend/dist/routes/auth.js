"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const db_1 = __importDefault(require("../utils/db"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-rateflow-key-2026';
// 1. Signup Route (Normal User only)
router.post('/signup', async (req, res) => {
    try {
        const { name, email, address, password } = req.body;
        // Validation
        const nameErr = (0, validation_1.validateName)(name);
        const emailErr = (0, validation_1.validateEmail)(email);
        const addressErr = (0, validation_1.validateAddress)(address);
        const passwordErr = (0, validation_1.validatePassword)(password);
        if (nameErr || emailErr || addressErr || passwordErr) {
            return res.status(400).json({
                errors: { name: nameErr, email: emailErr, address: addressErr, password: passwordErr },
            });
        }
        // Check if user already exists
        const existingUser = await db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'A user with this email already exists' });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create user
        const newUser = await db_1.default.user.create({
            data: {
                name,
                email,
                address,
                password: hashedPassword,
                role: client_1.Role.USER,
            },
        });
        // Sign JWT token
        const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
        return res.status(201).json({
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                address: newUser.address,
                role: newUser.role,
            },
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ error: 'Internal server error during signup' });
    }
});
// 2. Login Route (All roles)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // Find user
        const user = await db_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Sign token
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                address: user.address,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error during login' });
    }
});
// 3. Get Logged in User Profile
router.get('/me', auth_1.authenticateJWT, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await db_1.default.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                address: true,
                role: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({ user });
    }
    catch (error) {
        console.error('Me query error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// 4. Update Password (Normal User & Store Owner)
router.put('/password', auth_1.authenticateJWT, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Old password and new password are required' });
        }
        // Validate new password format
        const passwordErr = (0, validation_1.validatePassword)(newPassword);
        if (passwordErr) {
            return res.status(400).json({ error: passwordErr });
        }
        // Get current user details
        const dbUser = await db_1.default.user.findUnique({
            where: { id: req.user.id },
        });
        if (!dbUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Verify old password
        const isOldValid = await bcrypt.compare(oldPassword, dbUser.password);
        if (!isOldValid) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }
        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        // Update password
        await db_1.default.user.update({
            where: { id: req.user.id },
            data: { password: hashedNewPassword },
        });
        return res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('Password update error:', error);
        return res.status(500).json({ error: 'Internal server error during password update' });
    }
});
exports.default = router;
