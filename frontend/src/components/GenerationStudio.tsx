import { useState, useEffect } from 'react';
import {
  generationService,
  Generation,
  CreateGenerationData,
} from '../services/generation.js';
import { useGenerate } from '../hooks/useGenerate.js';
import { useRetry } from '../hooks/useRetry.js';
import Upload from './Upload.js';

const STYLES = [
  'Realistic',
  'Anime',
  'Oil Painting',
  'Watercolor',
  'Digital Art',
  'Sketch',
];

export default function GenerationStudio() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState(STYLES[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastGenerations, setPastGenerations] = useState<Generation[]>([]);

  const retry = useRetry({
    maxRetries: 3,
    onRetry: retryCount => {
      setError(retry.getRetryMessage(retryCount));
    },
    onMaxRetriesReached: () => {
      setIsGenerating(false);
      setError(retry.getMaxRetriesMessage());
      retry.reset();
    },
  });

  const { generate, abort } = useGenerate({
    onSuccess: async () => {
      await loadPastGenerations();
      setIsGenerating(false);
      retry.reset();
      setError(null);
    },
    onError: (error, errorMessage) => {
      // Check if we should retry (for 503 errors)
      if (retry.shouldRetry(error)) {
        // Schedule retry with exponential backoff
        const delay = retry.getRetryDelay(retry.retryCount - 1); // -1 because shouldRetry already incremented
        setTimeout(() => {
          handleGenerate();
        }, delay);
      } else {
        setIsGenerating(false);
        setError(errorMessage);
        retry.reset();
      }
    },
    onAbort: () => {
      setIsGenerating(false);
      setError('Generation aborted');
      retry.reset();
    },
  });

  // Fetch past generations on mount
  useEffect(() => {
    loadPastGenerations();
  }, []);

  const loadPastGenerations = async () => {
    try {
      const generations = await generationService.getGenerations(5);
      setPastGenerations(generations);
    } catch (err) {
      console.error('Failed to load past generations:', err);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    retry.reset();

    const data: CreateGenerationData = {
      prompt: prompt.trim(),
      style,
    };

    // Convert image to base64 if provided
    if (imageFile) {
      const base64Image = await convertImageToBase64(imageFile);
      data.imageUpload = base64Image;
    }

    await generate(data);
  };

  const handleAbort = () => {
    abort();
  };

  const handleRestoreGeneration = (generation: Generation) => {
    setPrompt(generation.prompt);
    setStyle(generation.style);
    setImageFile(null);
    setImagePreview(generation.imageUrl);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Image Generation Studio
          </h1>
          <p className="text-gray-600">
            Create stunning AI-generated images with custom prompts and styles
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Generation Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Create New Generation
              </h2>

              {/* Error Message */}
              {error && (
                <div
                  className={`mb-4 p-4 rounded-md ${
                    error.includes('overloaded')
                      ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* Image Upload */}
              <Upload
                onFileSelect={setImageFile}
                onPreviewChange={setImagePreview}
                imagePreview={imagePreview}
                disabled={isGenerating}
                onError={setError}
              />

              {/* Prompt Input */}
              <div className="mb-6">
                <label
                  htmlFor="prompt"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Prompt
                </label>
                <textarea
                  id="prompt"
                  rows={4}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isGenerating}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {prompt.length}/500 characters
                </p>
              </div>

              {/* Style Dropdown */}
              <div className="mb-6">
                <label
                  htmlFor="style"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Style
                </label>
                <select
                  id="style"
                  value={style}
                  onChange={e => setStyle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isGenerating}
                >
                  {STYLES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Generate Button */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate'
                  )}
                </button>
                {isGenerating && (
                  <button
                    type="button"
                    onClick={handleAbort}
                    className="px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Abort
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Past Generations Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Recent Generations
              </h2>
              {pastGenerations.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No generations yet. Create your first one!
                </p>
              ) : (
                <div className="space-y-4">
                  {pastGenerations.slice(0, 5).map(generation => (
                    <div
                      key={generation.id}
                      data-testid="past-generation-card"
                      className="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 cursor-pointer transition-colors"
                      onClick={() => handleRestoreGeneration(generation)}
                    >
                      <img
                        src={generation.imageUrl}
                        alt={generation.prompt}
                        className="w-full h-32 object-cover rounded-md mb-2"
                      />
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {generation.prompt}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {generation.style}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(generation.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
