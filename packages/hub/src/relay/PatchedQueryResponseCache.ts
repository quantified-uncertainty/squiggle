/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Patched for Squiggle Hub with `delete` method and converted to Typescript.

import {
  GraphQLResponse,
  GraphQLSingularResponse,
  Variables,
} from "relay-runtime";

import invariant from "invariant";

type Response = {
  fetchTime: number;
  payload: GraphQLResponse;
};

/**
 * Creates a copy of the provided value, ensuring any nested objects have their
 * keys sorted such that equivalent values would have identical JSON.stringify
 * results.
 */
function stableCopy(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(stableCopy);
  }
  const keys = Object.keys(value).sort();
  const stable: Record<string, any> = {};
  for (let i = 0; i < keys.length; i++) {
    stable[keys[i]] = stableCopy((value as Record<string, unknown>)[keys[i]]);
  }
  return stable;
}

/**
 * A cache for storing query responses, featuring:
 * - `get` with TTL
 * - cache size limiting, with least-recently *updated* entries purged first
 */
export class PatchedQueryResponseCache {
  _responses: Map<string, Response>;
  _size: number;
  _ttl: number;

  constructor({ size, ttl }: { size: number; ttl: number }) {
    invariant(
      size > 0,
      "RelayQueryResponseCache: Expected the max cache size to be > 0, got " +
        "`%s`.",
      size
    );
    invariant(
      ttl > 0,
      "RelayQueryResponseCache: Expected the max ttl to be > 0, got `%s`.",
      ttl
    );
    this._responses = new Map();
    this._size = size;
    this._ttl = ttl;
  }

  clear(): void {
    this._responses.clear();
  }

  get(queryID: string, variables: Variables): GraphQLResponse | null {
    const cacheKey = getCacheKey(queryID, variables);
    this._responses.forEach((response, key) => {
      if (!isCurrent(response.fetchTime, this._ttl)) {
        this._responses.delete(key);
      }
    });
    const response = this._responses.get(cacheKey);
    if (response == null) {
      return null;
    }

    const { payload } = response;

    if (Array.isArray(payload)) {
      return payload.map(
        (payloadItem) =>
          ({
            ...payloadItem,
            extensions: {
              ...payloadItem.extensions,
              cacheTimestamp: response.fetchTime,
            },
          }) satisfies GraphQLSingularResponse
      );
    }

    const singularPayload = payload as GraphQLSingularResponse;

    return {
      ...singularPayload,
      extensions: {
        ...singularPayload.extensions,
        cacheTimestamp: response.fetchTime,
      },
    } satisfies GraphQLSingularResponse;
  }

  set(queryID: string, variables: Variables, payload: GraphQLResponse): void {
    const fetchTime = Date.now();
    const cacheKey = getCacheKey(queryID, variables);
    this._responses.delete(cacheKey); // deletion resets key ordering
    this._responses.set(cacheKey, {
      fetchTime,
      payload,
    });
    // Purge least-recently updated key when max size reached
    if (this._responses.size > this._size) {
      const firstKey = this._responses.keys().next();
      if (!firstKey.done) {
        this._responses.delete(firstKey.value);
      }
    }
  }

  delete(queryID: string, variables: Variables) {
    const cacheKey = getCacheKey(queryID, variables);
    this._responses.delete(cacheKey);
  }
}

function getCacheKey(queryID: string, variables: Variables): string {
  return JSON.stringify(stableCopy({ queryID, variables }));
}

/**
 * Determine whether a response fetched at `fetchTime` is still valid given
 * some `ttl`.
 */
function isCurrent(fetchTime: number, ttl: number): boolean {
  return fetchTime + ttl >= Date.now();
}
