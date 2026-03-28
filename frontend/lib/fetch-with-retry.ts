/**
 * Fetch with exponential backoff retry logic
 * Handles transient failures and rate limiting gracefully
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryOnStatus?: number[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  retryOnStatus: [429, 500, 502, 503, 504], // Rate limit + server errors
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateBackoff(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  // Exponential backoff with jitter: delay = min(maxDelay, baseDelay * 2^attempt * (0.5 + random))
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const jitter = 0.5 + Math.random(); // 0.5 to 1.5
  return Math.min(maxDelayMs, exponentialDelay * jitter);
}

export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  const config = { ...DEFAULT_OPTIONS, ...retryOptions };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If response is ok or not a retryable status, return it
      if (response.ok || !config.retryOnStatus.includes(response.status)) {
        return response;
      }

      // Retryable error status
      if (attempt < config.maxRetries) {
        const delay = calculateBackoff(attempt, config.baseDelayMs, config.maxDelayMs);
        console.warn(
          `[fetchWithRetry] ${response.status} on ${url}, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${config.maxRetries})`
        );
        await sleep(delay);
        continue;
      }

      // Last attempt failed with retryable status
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < config.maxRetries) {
        const delay = calculateBackoff(attempt, config.baseDelayMs, config.maxDelayMs);
        console.warn(
          `[fetchWithRetry] Network error on ${url}, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${config.maxRetries}):`,
          lastError.message
        );
        await sleep(delay);
        continue;
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${config.maxRetries} retries`);
}

/**
 * JSON fetch with retry - convenience wrapper
 */
export async function fetchJsonWithRetry<T>(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<T> {
  const response = await fetchWithRetry(url, options, retryOptions);
  return response.json();
}
