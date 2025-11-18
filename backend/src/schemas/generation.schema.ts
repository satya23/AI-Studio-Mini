import { z } from 'zod';

export const createGenerationSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(500, 'Prompt must be at most 500 characters'),
  style: z
    .string()
    .min(1, 'Style is required')
    .max(100, 'Style must be at most 100 characters'),
});

export type CreateGenerationInput = z.infer<typeof createGenerationSchema>;
