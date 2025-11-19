import { useState, useCallback } from 'react';

interface UseRetryOptions {
  maxRetries?: number;
  onRetry?: (retryCount: number) => void;
  onMaxRetriesReached?: () => void;
}

export function useRetry(options: UseRetryOptions = {}) {
  const { maxRetries = 3, onRetry, onMaxRetriesReached } = options;
  const [retryCount, setRetryCount] = useState(0);

  const shouldRetry = useCallback(
    (error: unknown): boolean => {
      // Check if error is a 503 (model overloaded)
      const is503 =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'status' in error.response &&
        error.response.status === 503;

      if (!is503) {
        return false;
      }

      if (retryCount < maxRetries) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        onRetry?.(newRetryCount);

        return true;
      } else {
        onMaxRetriesReached?.();
        setRetryCount(0);
        return false;
      }
    },
    [retryCount, maxRetries, onRetry, onMaxRetriesReached]
  );

  const getRetryDelay = useCallback((retryCount: number): number => {
    // Exponential backoff: 1s, 2s, 4s (1000ms * 2^retryCount)
    return 1000 * Math.pow(2, retryCount);
  }, []);

  const reset = useCallback(() => {
    setRetryCount(0);
  }, []);

  const getRetryMessage = useCallback(
    (retryCount: number): string => {
      return `Model overloaded. Retrying... (${retryCount}/${maxRetries})`;
    },
    [maxRetries]
  );

  const getMaxRetriesMessage = useCallback((): string => {
    return 'Model is currently overloaded. Please try again in a few moments.';
  }, []);

  return {
    retryCount,
    shouldRetry,
    getRetryDelay,
    reset,
    getRetryMessage,
    getMaxRetriesMessage,
  };
}
