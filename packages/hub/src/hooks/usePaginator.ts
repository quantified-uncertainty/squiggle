import { useCallback, useState } from "react";

import { Paginated } from "@/server/types";

type FullPaginated<T> = {
  items: T[];
  // this is intentionally named `loadNext` instead of `loadMore` to avoid confusion
  loadNext?: (limit: number) => void;
  // Helper functions - if the server action has affected some items, we need to update the state.
  // This is similar to Relay's edge directives (https://relay.dev/docs/guided-tour/list-data/updating-connections/),
  // but more manual.
  append: (item: T) => void;
  remove: (compare: (item: T) => boolean) => void;
  update: (update: (item: T) => T) => void;
};

export function usePaginator<T>(initialPage: Paginated<T>): FullPaginated<T> {
  const [{ items, loadMore }, setPage] = useState(initialPage);

  const append = useCallback((newItem: T) => {
    setPage(({ items }) => ({
      items: [...items, newItem],
      loadMore,
    }));
  }, []);

  const remove = useCallback((compare: (item: T) => boolean) => {
    setPage(({ items }) => ({
      items: items.filter((i) => !compare(i)),
      loadMore,
    }));
  }, []);

  const update = useCallback((update: (item: T) => T) => {
    setPage(({ items }) => {
      const newItems = {
        items: items.map(update),
        loadMore,
      };
      console.log(newItems);
      return newItems;
    });
  }, []);

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
    append,
    remove,
    update,
  };
}
