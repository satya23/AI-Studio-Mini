import { Router } from 'express';
import {
  createGeneration,
  getGenerations,
} from '../controllers/generations.controller.js';
import { validateRequest } from '../utils/validation.js';
import { createGenerationSchema } from '../schemas/generation.schema.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Protect generation routes with authentication
router.post(
  '/',
  authenticateToken,
  validateRequest(createGenerationSchema),
  createGeneration
);
router.get('/', authenticateToken, getGenerations);

export default router;
