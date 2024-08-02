import { Type } from "./Type.js";

// `T extends Type<infer U> ? U : never` is not enough for complex generic types.
// So we infer from `unpack()` method instead.
export type UnwrapType<T extends Type<any>> = Exclude<
  ReturnType<T["unpack"]>,
  undefined
>;
