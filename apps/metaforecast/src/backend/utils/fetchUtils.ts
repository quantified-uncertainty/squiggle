import { sleep } from "./sleep";

export async function fetchJson(
  endpoint: string,
  {
    retries = 3,
  }: {
    retries?: number;
  } = {}
): Promise<unknown> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(
          `HTTP error ${response.status}: ${response.statusText}`
        );
      }
      return response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `Fetch attempt ${attempt + 1}/${retries} failed:`,
        lastError.message
      );

      if (attempt < retries - 1) {
        // Exponential backoff with jitter
        const delay =
          Math.min(1000 * Math.pow(2, attempt), 10000) *
          (0.75 + Math.random() * 0.5);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error("Failed to fetch after multiple attempts");
}
