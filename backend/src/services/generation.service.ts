import { GenerationModel } from '../models/generation.model.js';
import { CreateGenerationInput } from '../schemas/generation.schema.js';
import { Generation } from '../types/index.js';

export class GenerationService {
  static async create(
    userId: string,
    input: CreateGenerationInput
  ): Promise<Generation> {
    // Simulate 1-2 second generation delay
    const delay = Math.random() * 1000 + 1000; // 1000-2000ms
    await new Promise(resolve => setTimeout(resolve, delay));

    // 20% chance of model overloaded error
    if (Math.random() < 0.2) {
      throw new Error('Model overloaded');
    }

    // Simulate image generation - in a real app, this would call an AI service
    // If imageUpload is provided, use it; otherwise generate placeholder
    const imageUrl =
      input.imageUpload ||
      `https://placeholder.com/512x512?text=${encodeURIComponent(input.prompt)}`;

    // Create generation with completed status (simulated immediate completion)
    const generation = await GenerationModel.create({
      userId,
      prompt: input.prompt,
      style: input.style,
      imageUrl,
      status: 'completed',
    });

    return generation;
  }

  static async getByUserId(
    userId: string,
    limit?: number
  ): Promise<Generation[]> {
    const generations = await GenerationModel.findByUserId(userId);
    if (limit && limit > 0) {
      return generations.slice(0, limit);
    }
    return generations;
  }
}
