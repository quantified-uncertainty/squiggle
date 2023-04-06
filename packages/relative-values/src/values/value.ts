import { RelativeValue } from "./types";

export function hasInvalid(obj: RelativeValue): boolean {
  return Object.values(obj).some((value) => !isFinite(value));
}