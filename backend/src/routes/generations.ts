import { Router } from 'express';

const router = Router();

// Placeholder routes - will be implemented in future PRs
router.post('/', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

router.get('/', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router;

