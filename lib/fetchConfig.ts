export type FetchConfig = {
  // number of attempts for retry (including the first try)
  attempts: number;
  // base delay in ms used for exponential backoff (will be multiplied by 2**attempt)
  baseDelayMs: number;
  // maximum delay between retries
  maxDelayMs: number;
  // per-request timeout in ms (AbortController)
  timeoutMs: number;
};

// Mutable config object; tests or startup code can call setFetchConfig to change values
export const fetchConfig: FetchConfig = {
  attempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 2000,
  timeoutMs: 5000,
};

export function setFetchConfig(partial: Partial<FetchConfig>) {
  Object.assign(fetchConfig, partial);
}
