import { useState, useEffect, useRef } from 'react';
import {
  generationService,
  Generation,
  CreateGenerationData,
} from '../services/generation.service.js';

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
  const [retryCount, setRetryCount] = useState(0);
  const [pastGenerations, setPastGenerations] = useState<Generation[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/i)) {
      setError('Image must be JPEG or PNG format');
      return;
    }

    setError(null);
    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
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
    setRetryCount(0);

    // Create abort controller for this generation
    abortControllerRef.current = new AbortController();

    await attemptGeneration(abortControllerRef.current.signal);
  };

  const attemptGeneration = async (signal: AbortSignal) => {
    try {
      const data: CreateGenerationData = {
        prompt: prompt.trim(),
        style,
      };

      // Convert image to base64 if provided
      if (imageFile) {
        const base64Image = await convertImageToBase64(imageFile);
        data.imageUpload = base64Image;
      }

      await generationService.create(data, signal);

      // Check if aborted
      if (signal.aborted) {
        return;
      }

      // Success - reload past generations
      await loadPastGenerations();
      setIsGenerating(false);
      setRetryCount(0);
      abortControllerRef.current = null;

      // Show success message briefly
      setError(null);
    } catch (err: unknown) {
      // Check if aborted
      if (signal.aborted) {
        setIsGenerating(false);
        setError('Generation aborted');
        abortControllerRef.current = null;
        return;
      }

      // Handle abort error
      if (
        err &&
        typeof err === 'object' &&
        'name' in err &&
        err.name === 'CanceledError'
      ) {
        setIsGenerating(false);
        setError('Generation aborted');
        setRetryCount(0);
        abortControllerRef.current = null;
        return;
      }

      // Handle model overloaded error
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'status' in err.response &&
        err.response.status === 503
      ) {
        if (retryCount < 3) {
          const newRetryCount = retryCount + 1;
          setRetryCount(newRetryCount);
          setError(`Model overloaded. Retrying... (${newRetryCount}/3)`);
          // Retry after a short delay
          setTimeout(() => {
            attemptGeneration(signal);
          }, 1000);
        } else {
          setIsGenerating(false);
          setError(
            'Model is currently overloaded. Please try again in a few moments.'
          );
          setRetryCount(0);
          abortControllerRef.current = null;
        }
      } else {
        setIsGenerating(false);
        setError(
          err instanceof Error ? err.message : 'Failed to generate image'
        );
        setRetryCount(0);
        abortControllerRef.current = null;
      }
    }
  };

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setError('Generation aborted');
      abortControllerRef.current = null;
    }
  };

  const handleRestoreGeneration = (generation: Generation) => {
    setPrompt(generation.prompt);
    setStyle(generation.style);
    setImageFile(null);
    setImagePreview(generation.imageUrl);
    setError(null);
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
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
              <div className="mb-6">
                <label
                  htmlFor="imageUpload"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Upload Image (Optional, max 10MB, JPEG/PNG)
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      Choose File
                    </span>
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={isGenerating}
                    />
                  </label>
                  {imageFile && (
                    <span className="text-sm text-gray-600">
                      {imageFile.name} (
                      {(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="text-sm text-red-600 hover:text-red-800"
                      disabled={isGenerating}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full h-auto rounded-lg border border-gray-300 max-h-64 object-contain"
                    />
                  </div>
                )}
              </div>

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
                  disabled={isGenerating || !prompt.trim()}
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
                  {pastGenerations.map(generation => (
                    <div
                      key={generation.id}
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
