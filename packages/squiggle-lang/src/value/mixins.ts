import { Value } from "./index.js";

// Mixin for values that allow field lookups; just for type safety.
export type Indexable = {
  get(key: Value): Value;
};
