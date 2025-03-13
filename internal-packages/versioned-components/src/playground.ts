import { fromByteArray, toByteArray } from "base64-js";
import { deflate, inflate } from "pako";
import { z } from "zod";

import { checkSquiggleVersion, SquiggleVersion } from "./versions.js";

const HASH_PREFIX = "#code=";

// Hash data is compressed and encoded in the URL hash.
// We decode it and convert to PlaygroundParams.
const hashDataSchema = z.object({
  // legacy
  initialSquiggleCode: z.string().optional(),
  initialSquiggleString: z.string().optional(),
  // current
  defaultCode: z.string().optional(),
  showSummary: z.boolean().optional(),
});

type HashData = z.infer<typeof hashDataSchema>;

export type PlaygroundParams = {
  code?: string;
  version?: SquiggleVersion;
  showSummary?: boolean;
};

export function getPlaygroundUrl({
  code,
  version,
  showSummary,
  baseUrl = "https://squiggle-language.com/playground",
}: PlaygroundParams & {
  baseUrl?: string;
}): URL {
  const url = new URL(baseUrl);
  if (version) {
    url.searchParams.set("v", version);
  }
  const data: HashData = { defaultCode: code };
  if (showSummary !== undefined) {
    data.showSummary = showSummary;
  }
  const text = JSON.stringify(data);
  const compressed = deflate(text, { level: 9 });
  url.hash = HASH_PREFIX + encodeURIComponent(fromByteArray(compressed));
  return url;
}

export function parsePlaygroundUrl(url: URL): PlaygroundParams {
  const v = url.searchParams.get("v");
  const version = v && checkSquiggleVersion(v) ? v : undefined;

  const params: PlaygroundParams = { version };

  const hash = url.hash;
  if (!hash.startsWith(HASH_PREFIX)) {
    return params;
  }

  try {
    const compressed = toByteArray(
      decodeURIComponent(hash.slice(HASH_PREFIX.length))
    );
    const text = inflate(compressed, { to: "string" });
    const data: unknown = JSON.parse(text);
    const parsed = hashDataSchema.parse(data);

    params.code = parsed.defaultCode ?? parsed.initialSquiggleCode;
    params.showSummary = parsed.showSummary;
  } catch (err) {
    console.warn("Failed to parse playground URL", err);
  }
  return params;
}
