import { Request, Response } from 'express';
import { GenerationService } from '../services/generation.js';
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
    // Get userId from authenticated request (set by auth middleware)
    const userId = req.userId!; // Auth middleware ensures this exists

    // 20% chance of model overloaded error
    if (Math.random() < 0.2) {
      res.status(503).json({ message: 'Model overloaded' });
      return;
    }

    const input: CreateGenerationInput = req.body;
    const generation = await GenerationService.create(userId, input);

    // Return only the required fields
    res.status(201).json({
      id: generation.id,
      imageUrl: generation.imageUrl,
      prompt: generation.prompt,
      style: generation.style,
      createdAt: generation.createdAt,
      status: generation.status,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getGenerations = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // Get userId from authenticated request (set by auth middleware)
    const userId = req.userId!; // Auth middleware ensures this exists

    // Parse limit query parameter (default to 5 if not provided)
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;

    // Validate limit
    if (isNaN(limit) || limit < 1) {
      res.status(400).json({ message: 'Invalid limit parameter' });
      return;
    }

    const generations = await GenerationService.getByUserId(userId, limit);

    res.status(200).json({
      message: 'Generations retrieved successfully',
      generations,
      count: generations.length,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
