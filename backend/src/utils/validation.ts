import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

// Validation utilities - will be implemented in future PRs
export const validateRequest = (_schema: ZodSchema) => {
  return (_req: Request, _res: Response, next: NextFunction) => {
    // TODO: Implement request validation using Zod
    next();
  };
};
