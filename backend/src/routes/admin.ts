import { Router, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import prisma from '../utils/db';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';
import {
  validateEmail,
  validatePassword,
  validateName,
  validateAddress,
} from '../utils/validation';

const router = Router();

// Apply auth middleware and verify that user is an Admin
router.use(authenticateJWT);
router.use(requireRole([Role.ADMIN]));

// 1. Dashboard Stats
router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalStores = await prisma.store.count();
    const totalRatings = await prisma.rating.count();

    // Group users by role for advanced breakdown
    const userBreakdown = await prisma.user.groupBy({
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
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    return res.status(500).json({ error: 'Internal server error fetching dashboard stats' });
  }
});

// 2. Add new User
router.post('/users', async (req: AuthRequest, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    // Validate inputs
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const addressErr = validateAddress(address);

    if (nameErr || emailErr || passwordErr || addressErr) {
      return res.status(400).json({
        errors: { name: nameErr, email: emailErr, password: passwordErr, address: addressErr },
      });
    }

    if (!role || !Object.values(Role).includes(role as Role)) {
      return res.status(400).json({ error: 'Valid Role (ADMIN, USER, OWNER) is required' });
    }

    // Uniqueness checks
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        address,
        role: role as Role,
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
  } catch (error) {
    console.error('Admin create user error:', error);
    return res.status(500).json({ error: 'Internal server error creating user' });
  }
});

// 3. Add new Store
router.post('/stores', async (req: AuthRequest, res) => {
  try {
    const { name, email, address, ownerId } = req.body;

    // Validate
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const addressErr = validateAddress(address);

    if (nameErr || emailErr || addressErr) {
      return res.status(400).json({
        errors: { name: nameErr, email: emailErr, address: addressErr },
      });
    }

    // Check store email uniqueness
    const existingStore = await prisma.store.findUnique({ where: { email } });
    if (existingStore) {
      return res.status(400).json({ error: 'Store with this email already exists' });
    }

    // If ownerId is provided, verify it is an OWNER and does not already own a store
    if (ownerId) {
      const ownerUser = await prisma.user.findUnique({ where: { id: ownerId } });
      if (!ownerUser || ownerUser.role !== Role.OWNER) {
        return res.status(400).json({ error: 'Assigned owner must be an existing user with the role OWNER' });
      }

      const existingOwnerStore = await prisma.store.findUnique({ where: { ownerId } });
      if (existingOwnerStore) {
        return res.status(400).json({ error: 'This owner already manages another store' });
      }
    }

    const newStore = await prisma.store.create({
      data: {
        name,
        email,
        address,
        ownerId: ownerId || null,
      },
    });

    return res.status(201).json({ store: newStore });
  } catch (error) {
    console.error('Admin create store error:', error);
    return res.status(500).json({ error: 'Internal server error creating store' });
  }
});

// 4. View Stores list (with filtering, sorting and ratings)
router.get('/stores', async (req: AuthRequest, res) => {
  try {
    const { name, email, address, sortField, sortOrder } = req.query;

    // Filtering conditions
    const where: any = {};
    if (name) {
      where.name = { contains: name as string, mode: 'insensitive' };
    }
    if (email) {
      where.email = { contains: email as string, mode: 'insensitive' };
    }
    if (address) {
      where.address = { contains: address as string, mode: 'insensitive' };
    }

    // Fetch stores
    const stores = await prisma.store.findMany({
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
      const averageRating =
        totalRatings > 0
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
    const field = (sortField as string) || 'name';
    const order = (sortOrder as string) === 'desc' ? -1 : 1;

    storeList.sort((a: any, b: any) => {
      let valA = a[field];
      let valB = b[field];

      if (typeof valA === 'string') {
        return valA.localeCompare(valB) * order;
      }
      return (valA - valB) * order;
    });

    return res.json({ stores: storeList });
  } catch (error) {
    console.error('Admin fetch stores error:', error);
    return res.status(500).json({ error: 'Internal server error fetching stores' });
  }
});

// 5. View Users list (with filtering and sorting)
router.get('/users', async (req: AuthRequest, res) => {
  try {
    const { name, email, address, role, sortField, sortOrder } = req.query;

    const where: any = {};
    if (name) {
      where.name = { contains: name as string, mode: 'insensitive' };
    }
    if (email) {
      where.email = { contains: email as string, mode: 'insensitive' };
    }
    if (address) {
      where.address = { contains: address as string, mode: 'insensitive' };
    }
    if (role && Object.values(Role).includes(role as Role)) {
      where.role = role as Role;
    }

    const orderBy: any = {};
    if (sortField) {
      const field = sortField as string;
      orderBy[field] = (sortOrder as string) === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.name = 'asc';
    }

    const users = await prisma.user.findMany({
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
  } catch (error) {
    console.error('Admin fetch users error:', error);
    return res.status(500).json({ error: 'Internal server error fetching users' });
  }
});

// 6. View User Details (shows rating if Store Owner)
router.get('/users/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
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

    let averageRating: number | null = null;
    let storeDetails: any = null;

    if (user.role === Role.OWNER && user.store) {
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
  } catch (error) {
    console.error('Admin fetch user details error:', error);
    return res.status(500).json({ error: 'Internal server error fetching user details' });
  }
});

export default router;
