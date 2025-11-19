import { useRef } from 'react';
import { CreateGenerationData } from '../services/generation.js';
import { generationService } from '../services/generation.js';

interface UseGenerateOptions {
  onSuccess?: () => void;
  onError?: (error: unknown, errorMessage: string) => void;
  onAbort?: () => void;
}

export function useGenerate(options: UseGenerateOptions = {}) {
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = async (data: CreateGenerationData) => {
    // Create abort controller for this generation
    abortControllerRef.current = new AbortController();

    try {
      await generationService.create(data, abortControllerRef.current.signal);

      // Check if aborted
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      // Success
      options.onSuccess?.();
      abortControllerRef.current = null;
    } catch (err: unknown) {
      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        options.onAbort?.();
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
        options.onAbort?.();
        abortControllerRef.current = null;
        return;
      }

      // Handle other errors
      let message = 'Failed to generate image. Please try again.';
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data &&
        typeof err.response.data.message === 'string'
      ) {
        message = err.response.data.message;
      }
      options.onError?.(err, message);
      abortControllerRef.current = null;
    }
  };

  const abort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      options.onAbort?.();
      abortControllerRef.current = null;
    }
  };

  return {
    generate,
    abort,
    isAborted: () => abortControllerRef.current?.signal.aborted ?? false,
  };
}
