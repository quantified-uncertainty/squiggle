import { z } from "zod";

export const DEFAULT_HUB_URL = "https://squigglehub.org";

const CACHE_TTL_MS = 60_000;

const sourceSchema = z.object({ code: z.string() });

export class HubError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

// Fetches model source from Squiggle Hub's public `/api/get-source` endpoint,
// with a short in-memory cache so that re-runs don't hammer the Hub.
export function makeHubClient(hubUrl: string = DEFAULT_HUB_URL) {
  const cache = new Map<string, { code: string; fetchedAt: number }>();

  return {
    hubUrl,
    async getSource(owner: string, slug: string): Promise<string> {
      const key = `${owner}/${slug}`;
      const cached = cache.get(key);
      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.code;
      }
      const url = new URL("/api/get-source", hubUrl);
      url.searchParams.set("owner", owner);
      url.searchParams.set("slug", slug);

      let response: Response;
      try {
        response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      } catch (e) {
        throw new HubError(
          `Couldn't reach ${hubUrl}: ${e instanceof Error ? e.message : String(e)}`,
          502
        );
      }
      if (response.status === 404) {
        throw new HubError(`Hub model not found: ${key}`, 404);
      }
      if (!response.ok) {
        throw new HubError(
          `Hub request failed (${response.status} ${response.statusText})`,
          502
        );
      }
      const parsed = sourceSchema.safeParse(await response.json());
      if (!parsed.success) {
        throw new HubError(`Unexpected Hub response for ${key}`, 502);
      }
      cache.set(key, { code: parsed.data.code, fetchedAt: Date.now() });
      return parsed.data.code;
    },
  };
}

export type HubClient = ReturnType<typeof makeHubClient>;
