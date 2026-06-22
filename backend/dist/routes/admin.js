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
const db_1 = __importDefault(require("../utils/db"));
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const validation_1 = require("../utils/validation");
const router = (0, express_1.Router)();
// Apply auth middleware and verify that user is an Admin
router.use(auth_1.authenticateJWT);
router.use((0, auth_1.requireRole)([client_1.Role.ADMIN]));
// 1. Dashboard Stats
router.get('/dashboard', async (req, res) => {
    try {
        const totalUsers = await db_1.default.user.count();
        const totalStores = await db_1.default.store.count();
        const totalRatings = await db_1.default.rating.count();
        // Group users by role for advanced breakdown
        const userBreakdown = await db_1.default.user.groupBy({
            by: ['role'],
            _count: {
                _all: true,
            },
        });
        return res.json({
            totalUsers,
            totalStores,
            totalRatings,
            breakdown: userBreakdown.map((b) => ({ role: b.role, count: b._count._all })),
        });
    }
    catch (error) {
        console.error('Admin dashboard stats error:', error);
        return res.status(500).json({ error: 'Internal server error fetching dashboard stats' });
    }
});
// 2. Add new User
router.post('/users', async (req, res) => {
    try {
        const { name, email, password, address, role } = req.body;
        // Validate inputs
        const nameErr = (0, validation_1.validateName)(name);
        const emailErr = (0, validation_1.validateEmail)(email);
        const passwordErr = (0, validation_1.validatePassword)(password);
        const addressErr = (0, validation_1.validateAddress)(address);
        if (nameErr || emailErr || passwordErr || addressErr) {
            return res.status(400).json({
                errors: { name: nameErr, email: emailErr, password: passwordErr, address: addressErr },
            });
        }
        if (!role || !Object.values(client_1.Role).includes(role)) {
            return res.status(400).json({ error: 'Valid Role (ADMIN, USER, OWNER) is required' });
        }
        // Uniqueness checks
        const existingUser = await db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await db_1.default.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                address,
                role: role,
            },
            select: {
                id: true,
                name: true,
                email: true,
                address: true,
                role: true,
                createdAt: true,
            },
        });
        return res.status(201).json({ user: newUser });
    }
    catch (error) {
        console.error('Admin create user error:', error);
        return res.status(500).json({ error: 'Internal server error creating user' });
    }
});
// 3. Add new Store
router.post('/stores', async (req, res) => {
    try {
        const { name, email, address, ownerId } = req.body;
        // Validate
        const nameErr = (0, validation_1.validateName)(name);
        const emailErr = (0, validation_1.validateEmail)(email);
        const addressErr = (0, validation_1.validateAddress)(address);
        if (nameErr || emailErr || addressErr) {
            return res.status(400).json({
                errors: { name: nameErr, email: emailErr, address: addressErr },
            });
        }
        // Check store email uniqueness
        const existingStore = await db_1.default.store.findUnique({ where: { email } });
        if (existingStore) {
            return res.status(400).json({ error: 'Store with this email already exists' });
        }
        // If ownerId is provided, verify it is an OWNER and does not already own a store
        if (ownerId) {
            const ownerUser = await db_1.default.user.findUnique({ where: { id: ownerId } });
            if (!ownerUser || ownerUser.role !== client_1.Role.OWNER) {
                return res.status(400).json({ error: 'Assigned owner must be an existing user with the role OWNER' });
            }
            const existingOwnerStore = await db_1.default.store.findUnique({ where: { ownerId } });
            if (existingOwnerStore) {
                return res.status(400).json({ error: 'This owner already manages another store' });
            }
        }
        const newStore = await db_1.default.store.create({
            data: {
                name,
                email,
                address,
                ownerId: ownerId || null,
            },
        });
        return res.status(201).json({ store: newStore });
    }
    catch (error) {
        console.error('Admin create store error:', error);
        return res.status(500).json({ error: 'Internal server error creating store' });
    }
});
// 4. View Stores list (with filtering, sorting and ratings)
router.get('/stores', async (req, res) => {
    try {
        const { name, email, address, sortField, sortOrder } = req.query;
        // Filtering conditions
        const where = {};
        if (name) {
            where.name = { contains: name, mode: 'insensitive' };
        }
        if (email) {
            where.email = { contains: email, mode: 'insensitive' };
        }
        if (address) {
            where.address = { contains: address, mode: 'insensitive' };
        }
        // Fetch stores
        const stores = await db_1.default.store.findMany({
            where,
            include: {
                ratings: {
                    select: {
                        rating: true,
                    },
                },
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        // Map and compute average rating
        let storeList = stores.map((store) => {
            const totalRatings = store.ratings.length;
            const averageRating = totalRatings > 0
                ? Number((store.ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(2))
                : 0;
            return {
                id: store.id,
                name: store.name,
                email: store.email,
                address: store.address,
                averageRating,
                totalRatings,
                owner: store.owner,
            };
        });
        // Handle sorting programmatically since rating is computed
        const field = sortField || 'name';
        const order = sortOrder === 'desc' ? -1 : 1;
        storeList.sort((a, b) => {
            let valA = a[field];
            let valB = b[field];
            if (typeof valA === 'string') {
                return valA.localeCompare(valB) * order;
            }
            return (valA - valB) * order;
        });
        return res.json({ stores: storeList });
    }
    catch (error) {
        console.error('Admin fetch stores error:', error);
        return res.status(500).json({ error: 'Internal server error fetching stores' });
    }
});
// 5. View Users list (with filtering and sorting)
router.get('/users', async (req, res) => {
    try {
        const { name, email, address, role, sortField, sortOrder } = req.query;
        const where = {};
        if (name) {
            where.name = { contains: name, mode: 'insensitive' };
        }
        if (email) {
            where.email = { contains: email, mode: 'insensitive' };
        }
        if (address) {
            where.address = { contains: address, mode: 'insensitive' };
        }
        if (role && Object.values(client_1.Role).includes(role)) {
            where.role = role;
        }
        const orderBy = {};
        if (sortField) {
            const field = sortField;
            orderBy[field] = sortOrder === 'desc' ? 'desc' : 'asc';
        }
        else {
            orderBy.name = 'asc';
        }
        const users = await db_1.default.user.findMany({
            where,
            orderBy,
            select: {
                id: true,
                name: true,
                email: true,
                address: true,
                role: true,
                createdAt: true,
            },
        });
        return res.json({ users });
    }
    catch (error) {
        console.error('Admin fetch users error:', error);
        return res.status(500).json({ error: 'Internal server error fetching users' });
    }
});
// 6. View User Details (shows rating if Store Owner)
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await db_1.default.user.findUnique({
            where: { id },
            include: {
                store: {
                    include: {
                        ratings: true,
                    },
                },
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        let averageRating = null;
        let storeDetails = null;
        if (user.role === client_1.Role.OWNER && user.store) {
            const ratings = user.store.ratings;
            const totalRatings = ratings.length;
            averageRating =
                totalRatings > 0
                    ? Number((ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(2))
                    : 0;
            storeDetails = {
                id: user.store.id,
                name: user.store.name,
                email: user.store.email,
                address: user.store.address,
            };
        }
        return res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                address: user.address,
                role: user.role,
                createdAt: user.createdAt,
            },
            store: storeDetails,
            averageRating,
        });
    }
    catch (error) {
        console.error('Admin fetch user details error:', error);
        return res.status(500).json({ error: 'Internal server error fetching user details' });
    }
});
exports.default = router;
