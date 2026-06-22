import { Router, Response } from 'express';
import prisma from '../utils/db';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Apply auth middleware and verify that user has USER role
router.use(authenticateJWT);
router.use(requireRole([Role.USER]));

// 1. Get Stores for Normal Users (with search, average ratings, and user-specific rating)
router.get('/stores', async (req: AuthRequest, res) => {
  try {
    const { name, address, sortField, sortOrder } = req.query;
    const userId = req.user!.id;

    // Filters
    const where: any = {};
    if (name) {
      where.name = { contains: name as string, mode: 'insensitive' };
    }
    if (address) {
      where.address = { contains: address as string, mode: 'insensitive' };
    }

    // Fetch stores along with ratings
    const stores = await prisma.store.findMany({
      where,
      include: {
        ratings: true,
      },
    });

    // Compute average ratings and check if the current user has rated
    let storeList = stores.map((store) => {
      const allRatings = store.ratings;
      const totalRatings = allRatings.length;
      const averageRating =
        totalRatings > 0
          ? Number((allRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(2))
          : 0;

      // Find current user's submitted rating
      const userRatingRecord = allRatings.find((r) => r.userId === userId);
      const userSubmittedRating = userRatingRecord ? userRatingRecord.rating : null;
      const userRatingId = userRatingRecord ? userRatingRecord.id : null;

      return {
        id: store.id,
        name: store.name,
        address: store.address,
        overallRating: averageRating,
        totalRatings,
        userSubmittedRating,
        userRatingId,
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
    console.error('User fetch stores error:', error);
    return res.status(500).json({ error: 'Internal server error fetching stores' });
  }
});

// 2. Submit a rating
router.post('/ratings', async (req: AuthRequest, res) => {
  try {
    const { storeId, rating } = req.body;
    const userId = req.user!.id;

    if (!storeId || rating === undefined) {
      return res.status(400).json({ error: 'Store ID and rating are required' });
    }

    const ratingVal = Number(rating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    // Check store exists
    const storeExists = await prisma.store.findUnique({ where: { id: storeId } });
    if (!storeExists) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if user already rated this store
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_storeId: { userId, storeId },
      },
    });

    if (existingRating) {
      return res.status(400).json({ error: 'You have already rated this store. Please modify your existing rating instead.' });
    }

    const newRating = await prisma.rating.create({
      data: {
        rating: ratingVal,
        userId,
        storeId,
      },
    });

    return res.status(201).json({ rating: newRating });
  } catch (error) {
    console.error('Submit rating error:', error);
    return res.status(500).json({ error: 'Internal server error submitting rating' });
  }
});

// 3. Modify submitted rating
router.put('/ratings/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const userId = req.user!.id;

    if (rating === undefined) {
      return res.status(400).json({ error: 'Rating is required' });
    }

    const ratingVal = Number(rating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    // Check if rating exists and belongs to the user
    const dbRating = await prisma.rating.findUnique({ where: { id } });
    if (!dbRating) {
      return res.status(404).json({ error: 'Rating not found' });
    }

    if (dbRating.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You cannot modify another user\'s rating' });
    }

    const updatedRating = await prisma.rating.update({
      where: { id },
      data: { rating: ratingVal },
    });

    return res.json({ rating: updatedRating });
  } catch (error) {
    console.error('Modify rating error:', error);
    return res.status(500).json({ error: 'Internal server error modifying rating' });
  }
});

export default router;
