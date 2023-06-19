import { LocationRange } from "peggy";

export function locationContains(location: LocationRange, offset: number) {
  return location.start.offset <= offset && location.end.offset >= offset;
}
