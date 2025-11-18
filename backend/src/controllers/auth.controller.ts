import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { SignupInput } from '../schemas/auth.schema.js';

export const signup = async (req: Request, res: Response) => {
  try {
    const input: SignupInput = req.body;
    const user = await AuthService.signup(input);

    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User with this email already exists') {
        res.status(409).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const login = async (_req: Request, _res: Response) => {
  // TODO: Implement login logic
};
