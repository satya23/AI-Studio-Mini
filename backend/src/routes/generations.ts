import { Router } from 'express';
import {
  createGeneration,
  getGenerations,
} from '../controllers/generations.controller.js';
import { validateRequest } from '../utils/validation.js';
import { createGenerationSchema } from '../schemas/generation.schema.js';

const router = Router();

router.post('/', validateRequest(createGenerationSchema), createGeneration);
router.get('/', getGenerations);

export default router;
