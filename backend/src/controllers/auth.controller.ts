import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { SignupInput, LoginInput } from '../schemas/auth.schema.js';

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

export const login = async (req: Request, res: Response) => {
  try {
    const input: LoginInput = req.body;
    const result = await AuthService.login(input);

    res.status(200).json({
      message: 'Login successful',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid email or password') {
        res.status(401).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
