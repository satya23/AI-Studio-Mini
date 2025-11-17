import { Router } from 'express';

const router = Router();

// Placeholder routes - will be implemented in future PRs
router.post('/signup', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

router.post('/login', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router;

