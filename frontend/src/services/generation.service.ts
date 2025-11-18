import api from './api.js';

export interface Generation {
  id: string;
  imageUrl: string;
  prompt: string;
  style: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface CreateGenerationData {
  prompt: string;
  style: string;
  imageUpload?: string;
}

export interface CreateGenerationResponse {
  id: string;
  imageUrl: string;
  prompt: string;
  style: string;
  createdAt: string;
  status: string;
}

export interface GetGenerationsResponse {
  message: string;
  generations: Generation[];
  count: number;
}

export const generationService = {
  async create(
    data: CreateGenerationData,
    signal?: AbortSignal
  ): Promise<CreateGenerationResponse> {
    const response = await api.post<CreateGenerationResponse>(
      '/generations',
      data,
      { signal }
    );
    return response.data;
  },

  async getGenerations(limit: number = 5): Promise<Generation[]> {
    const response = await api.get<GetGenerationsResponse>(
      `/generations?limit=${limit}`
    );
    return response.data.generations;
  },
};

