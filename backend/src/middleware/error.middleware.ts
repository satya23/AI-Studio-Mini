import { Request, Response, NextFunction } from 'express';

// Error handling middleware - will be implemented in future PRs
export const errorHandler = (
  _err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // TODO: Implement error handling
  res.status(500).json({ message: 'Internal server error' });
};
