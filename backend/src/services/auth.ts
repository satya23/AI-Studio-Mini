import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model.js';
import { SignupInput, LoginInput } from '../schemas/auth.schema.js';

const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  static async signup(input: SignupInput): Promise<{
    id: string;
    email: string;
    createdAt: Date;
  }> {
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(input.password, saltRounds);

    // Create user
    const user = await UserModel.create({
      email: input.email,
      password: hashedPassword,
    });

    // Return user without password
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  static async login(input: LoginInput): Promise<{
    user: {
      id: string;
      email: string;
      createdAt: Date;
    };
    token: string;
  }> {
    // Find user by email
    const user = await UserModel.findByEmail(input.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    // Return user without password and token
    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  }
}
