import { Router, Request, Response } from 'express';

const router = Router();

// Placeholder routes - will be implemented in future PRs
router.post('/signup', (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

router.post('/login', (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router;
