// Error handling middleware - will be implemented in future PRs
export const errorHandler = (err: any, req: any, res: any, next: any) => {
  // TODO: Implement error handling
  res.status(500).json({ message: 'Internal server error' });
};

