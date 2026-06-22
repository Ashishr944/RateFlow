import { Router, Response } from 'express';
import prisma from '../utils/db';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Apply auth middleware and verify that user has OWNER role
router.use(authenticateJWT);
router.use(requireRole([Role.OWNER]));

// Get Store Owner Dashboard data (store average rating, list of raters)
router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const ownerId = req.user!.id;

    // Find the store belonging to this owner
    const store = await prisma.store.findUnique({
      where: { ownerId },
      include: {
        ratings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                address: true,
              },
            },
          },
        },
      },
    });

    if (!store) {
      return res.json({
        hasStore: false,
        message: 'No store is currently registered under your account. Please contact the administrator.',
      });
    }

    const ratings = store.ratings;
    const totalRatings = ratings.length;
    const averageRating =
      totalRatings > 0
        ? Number((ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(2))
        : 0;

    // Format list of users who rated
    const reviewers = ratings.map((r) => ({
      ratingId: r.id,
      rating: r.rating,
      createdAt: r.createdAt,
      user: {
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        address: r.user.address,
      },
    }));

    return res.json({
      hasStore: true,
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
      },
      averageRating,
      totalRatings,
      reviewers,
    });
  } catch (error) {
    console.error('Owner dashboard stats error:', error);
    return res.status(500).json({ error: 'Internal server error fetching owner dashboard' });
  }
});

export default router;
