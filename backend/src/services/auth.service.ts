import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model.js';
import { SignupInput } from '../schemas/auth.schema.js';

export class AuthService {
  static async signup(input: SignupInput): Promise<{
    id: string;
    email: string;
    createdAt: Date;
  }> {
    // Check if user already exists
    const existingUser = UserModel.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(input.password, saltRounds);

    // Create user
    const user = UserModel.create({
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
}
