import { InputObjectRef } from "@pothos/core";

// It's possible that this helper exists in Pothos, but I couldn't find it quickly and it's easy enough to reimplement.
export type ExtractInputShape<T> = T extends InputObjectRef<infer A>
  ? A
  : never;
