import { Router, Request, Response } from 'express';

const router = Router();

// Placeholder routes - will be implemented in future PRs
router.post('/', (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

router.get('/', (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router;
