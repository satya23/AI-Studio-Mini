// Shared types will be defined here
export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface Generation {
  id: string;
  userId: string;
  prompt: string;
  style: string;
  imageUrl: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

