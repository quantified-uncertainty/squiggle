import { TArray } from "./TArray.js";
import { KVListToDict, TDict } from "./TDict.js";
import { TTuple } from "./TTuple.js";
import { Type } from "./Type.js";

// `T extends Type<infer U> ? U : never` is unfortunately not enough for generic types, e.g. `TDict`.
// So we have to handle each such class manually.
// (This seems like TypeScript limitation, but I'm not 100% sure.)
export type UnwrapType<T extends Type<any>> =
  T extends TDict<infer KVList>
    ? KVListToDict<KVList>
    : T extends TArray<infer U>
      ? readonly U[]
      : T extends TTuple<infer U>
        ? U
        : T extends Type<infer U>
          ? U
          : never;
