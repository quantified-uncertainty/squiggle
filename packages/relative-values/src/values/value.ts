import { RelativeValue } from "./types.js";

export function hasInvalid(obj: RelativeValue): boolean {
  return Object.values(obj).some((value) => !Number.isFinite(value));
}
