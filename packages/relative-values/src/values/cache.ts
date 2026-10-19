import { RelativeValueResult } from "./types.js";

/**
 * Cache key for a pair of item ids; use `makePairKey` to build it.
 */
export type PairKey = string;

export function makePairKey(id1: string, id2: string): PairKey {
  return JSON.stringify([id1, id2]);
}

export function parsePairKey(key: PairKey): [string, string] {
  const parsed: unknown = JSON.parse(key);
  if (
    !Array.isArray(parsed) ||
    parsed.length !== 2 ||
    typeof parsed[0] !== "string" ||
    typeof parsed[1] !== "string"
  ) {
    throw new Error(`Invalid pair key: ${key}`);
  }
  return [parsed[0], parsed[1]];
}

/**
 * Pluggable cache for pairwise comparisons.
 *
 * `ModelEvaluator` consults the cache before running Squiggle code, and stores
 * freshly computed results in it. Implementations can be backed by memory,
 * localStorage, a database (Squiggle Hub prefills one from Postgres), etc.
 */
export type RelativeValuesCache = {
  get(key: PairKey): RelativeValueResult | undefined;
  set(key: PairKey, result: RelativeValueResult): void;
};

export class InMemoryRelativeValuesCache implements RelativeValuesCache {
  private map: Map<PairKey, RelativeValueResult>;

  constructor(initial?: Iterable<[PairKey, RelativeValueResult]>) {
    this.map = new Map(initial);
  }

  get(key: PairKey) {
    return this.map.get(key);
  }

  set(key: PairKey, result: RelativeValueResult) {
    this.map.set(key, result);
  }

  get size() {
    return this.map.size;
  }

  entries() {
    return this.map.entries();
  }
}
