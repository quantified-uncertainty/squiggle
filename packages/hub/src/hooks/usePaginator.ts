import { useState } from "react";

import { Paginated } from "@/server/models/data";

export function usePaginator<T>(initialPage: Paginated<T>): {
  items: T[];
  // this is intentionally named `loadNext` instead of `loadMore` to avoid confusion
  loadNext?: (limit: number) => void;
} {
  const [{ items, loadMore }, setPage] = useState(initialPage);

  return {
    items,
    loadNext: loadMore
      ? (limit: number) => {
          loadMore(limit).then(({ items: newItems, loadMore: newLoadMore }) => {
            // In theory, there should be no duplicates, if `loadMore` is implemented correctly.
            // But maybe we should check for duplicate keys and skip them.
            // This would require a separate (optional?) `getKey` parameter to this hook.
            setPage(({ items }) => ({
              items: [...items, ...newItems],
              loadMore: newLoadMore,
            }));
          });
        }
      : undefined,
  };
}
