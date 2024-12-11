export type Paginated<T> = {
  items: T[];
  loadMore?: (limit: number) => Promise<Paginated<T>>;
};
