import { Request, Response, NextFunction } from 'express';

// Auth middleware - will be implemented in future PRs
export const authenticateToken = (
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  // TODO: Implement JWT token verification
  next();
};
