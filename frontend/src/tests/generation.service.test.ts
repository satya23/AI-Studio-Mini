import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generationService } from '../services/generation.service.js';
import api from '../services/api.js';

vi.mock('../services/api.js', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('generationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a generation successfully', async () => {
      const mockData = {
        prompt: 'A beautiful sunset',
        style: 'Realistic',
      };
      const mockResponse = {
        id: 'gen-1',
        imageUrl: 'https://example.com/image.jpg',
        prompt: 'A beautiful sunset',
        style: 'Realistic',
        createdAt: new Date().toISOString(),
        status: 'completed',
      };

      vi.mocked(api.post).mockResolvedValue({
        data: mockResponse,
      } as never);

      const result = await generationService.create(mockData);

      expect(api.post).toHaveBeenCalledWith('/generations', mockData, {
        signal: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should create a generation with image upload', async () => {
      const mockData = {
        prompt: 'A beautiful sunset',
        style: 'Realistic',
        imageUpload: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      };
      const mockResponse = {
        id: 'gen-1',
        imageUrl: 'https://example.com/image.jpg',
        prompt: 'A beautiful sunset',
        style: 'Realistic',
        createdAt: new Date().toISOString(),
        status: 'completed',
      };

      vi.mocked(api.post).mockResolvedValue({
        data: mockResponse,
      } as never);

      const result = await generationService.create(mockData);

      expect(api.post).toHaveBeenCalledWith('/generations', mockData, {
        signal: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should support abort signal', async () => {
      const mockData = {
        prompt: 'A beautiful sunset',
        style: 'Realistic',
      };
      const abortController = new AbortController();

      vi.mocked(api.post).mockResolvedValue({
        data: {
          id: 'gen-1',
          imageUrl: 'https://example.com/image.jpg',
          prompt: 'A beautiful sunset',
          style: 'Realistic',
          createdAt: new Date().toISOString(),
          status: 'completed',
        },
      } as never);

      await generationService.create(mockData, abortController.signal);

      expect(api.post).toHaveBeenCalledWith('/generations', mockData, {
        signal: abortController.signal,
      });
    });
  });

  describe('getGenerations', () => {
    it('should fetch generations with default limit', async () => {
      const mockResponse = {
        message: 'Generations retrieved successfully',
        generations: [
          {
            id: 'gen-1',
            imageUrl: 'https://example.com/image1.jpg',
            prompt: 'Sunset',
            style: 'Realistic',
            status: 'completed',
            createdAt: new Date().toISOString(),
          },
        ],
        count: 1,
      };

      vi.mocked(api.get).mockResolvedValue({
        data: mockResponse,
      } as never);

      const result = await generationService.getGenerations();

      expect(api.get).toHaveBeenCalledWith('/generations?limit=5');
      expect(result).toEqual(mockResponse.generations);
    });

    it('should fetch generations with custom limit', async () => {
      const mockResponse = {
        message: 'Generations retrieved successfully',
        generations: [],
        count: 0,
      };

      vi.mocked(api.get).mockResolvedValue({
        data: mockResponse,
      } as never);

      const result = await generationService.getGenerations(10);

      expect(api.get).toHaveBeenCalledWith('/generations?limit=10');
      expect(result).toEqual([]);
    });
  });
});

