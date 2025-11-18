import { Request, Response } from 'express';
import { GenerationService } from '../services/generation.service.js';
import { CreateGenerationInput } from '../schemas/generation.schema.js';

// Extend Request to include user ID from auth middleware
interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const createGeneration = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // Get userId from authenticated request (will be set by auth middleware)
    const userId = req.userId || 'anonymous'; // Temporary until auth is implemented

    const input: CreateGenerationInput = req.body;
    const generation = await GenerationService.create(userId, input);

    res.status(201).json({
      message: 'Generation created successfully',
      generation,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getGenerations = async (_req: Request, _res: Response) => {
  // TODO: Implement get generations logic
};
