import "server-only";

import { Paginated } from "../types";

export function findPaginated<T>(cursor: string | undefined, limit: number) {
  return {
    cursor: cursor ? { id: cursor } : undefined,
    take: limit + 1, // Select one extra row to check if we're at the end. Last row is sliced in `makePaginated`.
  };
}

export function makePaginated<T>(
  items: T[],
  limit: number,
  loadMore: (limit: number) => Promise<Paginated<T>>
): Paginated<T> {
  return {
    items: items.slice(0, limit),
    loadMore: items.length > limit ? loadMore : undefined,
  };
}
