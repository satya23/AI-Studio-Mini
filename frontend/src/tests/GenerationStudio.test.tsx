import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext.js';
import GenerationStudio from '../components/GenerationStudio.js';
import { generationService } from '../services/generation.service.js';
import { authService } from '../services/auth.service.js';

// Mock the services
vi.mock('../services/generation.service.js', () => ({
  generationService: {
    create: vi.fn(),
    getGenerations: vi.fn(),
  },
}));

vi.mock('../services/auth.service.js', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
  },
}));

describe('GenerationStudio Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Mock auth service
    vi.mocked(authService.getCurrentUser).mockReturnValue({
      id: '1',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
    });
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderGenerationStudio = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <GenerationStudio />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('should render generation studio with all form fields', () => {
    vi.mocked(generationService.getGenerations).mockResolvedValue([]);

    renderGenerationStudio();

    expect(screen.getByText('Image Generation Studio')).toBeInTheDocument();
    expect(screen.getByLabelText(/Upload Image/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Prompt/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Style/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
  });

  it('should update prompt when user types', async () => {
    const user = userEvent.setup();
    vi.mocked(generationService.getGenerations).mockResolvedValue([]);

    renderGenerationStudio();

    const promptInput = screen.getByLabelText(/Prompt/i);
    await act(async () => {
      await user.type(promptInput, 'A beautiful sunset');
    });

    expect(promptInput).toHaveValue('A beautiful sunset');
  });

  it('should update style when user selects from dropdown', async () => {
    const user = userEvent.setup();
    vi.mocked(generationService.getGenerations).mockResolvedValue([]);

    renderGenerationStudio();

    const styleSelect = screen.getByLabelText(/Style/i);
    await act(async () => {
      await user.selectOptions(styleSelect, 'Anime');
    });

    expect(styleSelect).toHaveValue('Anime');
  });

  it('should show image preview when image is uploaded', async () => {
    const user = userEvent.setup();
    vi.mocked(generationService.getGenerations).mockResolvedValue([]);

    renderGenerationStudio();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/Upload Image/i);

    await act(async () => {
      await user.upload(fileInput, file);
    });

    await waitFor(() => {
      const preview = screen.getByAltText('Preview');
      expect(preview).toBeInTheDocument();
    });
  });

  it('should show error for file size exceeding 10MB', async () => {
    const user = userEvent.setup();
    vi.mocked(generationService.getGenerations).mockResolvedValue([]);

    renderGenerationStudio();

    // Create a file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });
    const fileInput = screen.getByLabelText(/Upload Image/i);

    await act(async () => {
      await user.upload(fileInput, largeFile);
    });

    await waitFor(() => {
      expect(
        screen.getByText('Image size must be less than 10MB')
      ).toBeInTheDocument();
    });
  });

  it('should show error for invalid file type', async () => {
    const user = userEvent.setup();
    vi.mocked(generationService.getGenerations).mockResolvedValue([]);

    renderGenerationStudio();

    const invalidFile = new File(['test'], 'test.gif', { type: 'image/gif' });
    const fileInput = screen.getByLabelText(/Upload Image/i);

    await act(async () => {
      await user.upload(fileInput, invalidFile);
    });

    await waitFor(() => {
      expect(
        screen.getByText('Image must be JPEG or PNG format')
      ).toBeInTheDocument();
    });
  });

  it('should call generation service on form submit', async () => {
    const user = userEvent.setup();
    const mockGeneration = {
      id: 'gen-1',
      imageUrl: 'https://example.com/image.jpg',
      prompt: 'A beautiful sunset',
      style: 'Realistic',
      createdAt: new Date().toISOString(),
      status: 'completed',
    };

    vi.mocked(generationService.getGenerations)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([mockGeneration]);
    vi.mocked(generationService.create).mockResolvedValue(mockGeneration);

    renderGenerationStudio();

    const promptInput = screen.getByLabelText(/Prompt/i);
    const generateButton = screen.getByRole('button', { name: /generate/i });

    await act(async () => {
      await user.type(promptInput, 'A beautiful sunset');
      await user.click(generateButton);
    });

    await waitFor(() => {
      expect(generationService.create).toHaveBeenCalledWith(
        {
          prompt: 'A beautiful sunset',
          style: 'Realistic',
        },
        expect.any(AbortSignal)
      );
    });
  });

  it('should show spinner during generation', async () => {
    const user = userEvent.setup();
    vi.mocked(generationService.getGenerations).mockResolvedValue([]);

    // Create a promise that doesn't resolve immediately
    let resolvePromise: (value: unknown) => void;
    const delayedPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    vi.mocked(generationService.create).mockReturnValue(
      delayedPromise as never
    );

    renderGenerationStudio();

    const promptInput = screen.getByLabelText(/Prompt/i);
    const generateButton = screen.getByRole('button', { name: /generate/i });

    await act(async () => {
      await user.type(promptInput, 'A beautiful sunset');
      await user.click(generateButton);
    });

    expect(screen.getByText(/Generating.../i)).toBeInTheDocument();
    expect(generateButton).toBeDisabled();

    // Resolve the promise
    await act(async () => {
      resolvePromise!({
        id: 'gen-1',
        imageUrl: 'https://example.com/image.jpg',
        prompt: 'A beautiful sunset',
        style: 'Realistic',
        createdAt: new Date().toISOString(),
        status: 'completed',
      });
      await delayedPromise;
    });
  });

  it('should handle model overloaded error with retry', async () => {
    const user = userEvent.setup();
    vi.mocked(generationService.getGenerations).mockResolvedValue([]);

    // First call fails with 503, second succeeds
    vi.mocked(generationService.create)
      .mockRejectedValueOnce({
        response: { status: 503 },
      })
      .mockResolvedValueOnce({
        id: 'gen-1',
        imageUrl: 'https://example.com/image.jpg',
        prompt: 'A beautiful sunset',
        style: 'Realistic',
        createdAt: new Date().toISOString(),
        status: 'completed',
      });

    renderGenerationStudio();

    const promptInput = screen.getByLabelText(/Prompt/i);
    const generateButton = screen.getByRole('button', { name: /generate/i });

    await act(async () => {
      await user.type(promptInput, 'A beautiful sunset');
      await user.click(generateButton);
    });

    await waitFor(
      () => {
        expect(
          screen.getByText(/Model overloaded. Retrying.../i)
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should show abort button during generation', async () => {
    const user = userEvent.setup();
    vi.mocked(generationService.getGenerations).mockResolvedValue([]);

    let resolvePromise: (value: unknown) => void;
    const delayedPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    vi.mocked(generationService.create).mockReturnValue(
      delayedPromise as never
    );

    renderGenerationStudio();

    const promptInput = screen.getByLabelText(/Prompt/i);
    const generateButton = screen.getByRole('button', { name: /generate/i });

    await act(async () => {
      await user.type(promptInput, 'A beautiful sunset');
      await user.click(generateButton);
    });

    const abortButton = screen.getByRole('button', { name: /abort/i });
    expect(abortButton).toBeInTheDocument();

    // Resolve to clean up
    await act(async () => {
      resolvePromise!({
        id: 'gen-1',
        imageUrl: 'https://example.com/image.jpg',
        prompt: 'A beautiful sunset',
        style: 'Realistic',
        createdAt: new Date().toISOString(),
        status: 'completed',
      });
      await delayedPromise;
    });
  });

  it('should display past generations', async () => {
    const mockGenerations = [
      {
        id: 'gen-1',
        imageUrl: 'https://example.com/image1.jpg',
        prompt: 'Sunset',
        style: 'Realistic',
        status: 'completed' as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'gen-2',
        imageUrl: 'https://example.com/image2.jpg',
        prompt: 'Mountain',
        style: 'Anime',
        status: 'completed' as const,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.mocked(generationService.getGenerations).mockResolvedValue(
      mockGenerations
    );

    renderGenerationStudio();

    await waitFor(() => {
      expect(screen.getByText('Sunset')).toBeInTheDocument();
      expect(screen.getByText('Mountain')).toBeInTheDocument();
    });
  });

  it('should restore generation when clicking on past generation', async () => {
    const user = userEvent.setup();
    const mockGeneration = {
      id: 'gen-1',
      imageUrl: 'https://example.com/image1.jpg',
      prompt: 'Sunset over mountains',
      style: 'Anime',
      status: 'completed' as const,
      createdAt: new Date().toISOString(),
    };

    vi.mocked(generationService.getGenerations).mockResolvedValue([
      mockGeneration,
    ]);

    renderGenerationStudio();

    await waitFor(() => {
      expect(screen.getByText('Sunset over mountains')).toBeInTheDocument();
    });

    const generationCard = screen.getByText('Sunset over mountains').closest('div');
    expect(generationCard).toBeInTheDocument();

    await act(async () => {
      if (generationCard) {
        await user.click(generationCard);
      }
    });

    const promptInput = screen.getByLabelText(/Prompt/i);
    expect(promptInput).toHaveValue('Sunset over mountains');

    const styleSelect = screen.getByLabelText(/Style/i);
    expect(styleSelect).toHaveValue('Anime');
  });

  it('should show error when prompt is empty', async () => {
    const user = userEvent.setup();
    vi.mocked(generationService.getGenerations).mockResolvedValue([]);

    renderGenerationStudio();

    const generateButton = screen.getByRole('button', { name: /generate/i });

    await act(async () => {
      await user.click(generateButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Please enter a prompt')).toBeInTheDocument();
    });
  });
});

