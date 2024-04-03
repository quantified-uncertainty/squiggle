import sortBy from "lodash/sortBy.js";

import { extractSubsetThatSatisfiesThreshold, XYShape } from "../XYShape.js";
import { NumberSet } from "./NumberSet.js";
import { Range, RangeSet } from "./RangeSet.js";

export class MixedSet {
  public readonly numberSet: NumberSet;
  public readonly rangeSet: RangeSet;

  constructor(points: readonly number[], segments: readonly Range[]) {
    this.numberSet = new NumberSet(points);
    this.rangeSet = new RangeSet(segments);
  }

  static fromDiscreteDistShape(shape: XYShape) {
    return new MixedSet(shape.xs, []);
  }

  static fromContinuousDistShape(shape: XYShape) {
    return new MixedSet(
      [],
      sortBy(
        extractSubsetThatSatisfiesThreshold(
          shape,
          "greaterThan",
          0
        ).segments.map((xyShape) => [
          xyShape.xs[0],
          xyShape.xs[xyShape.xs.length - 1],
        ]),
        ([start, _]) => start
      )
    );
  }

  //Going forward, it would be good to use the same conventions as the Javascript Set class
  //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set

  difference(other: MixedSet): MixedSet {
    return new MixedSet(
      this.numberSet.difference(other.numberSet).numbers,
      this.rangeSet.difference(other.rangeSet).ranges
    );
  }

  intersection(other: MixedSet): MixedSet {
    return new MixedSet(
      this.numberSet.intersection(other.numberSet).numbers,
      this.rangeSet.intersection(other.rangeSet).ranges
    );
  }

  union(other: MixedSet): MixedSet {
    return new MixedSet(
      this.numberSet.union(other.numberSet).numbers,
      this.rangeSet.union(other.rangeSet).ranges
    );
  }

  isSubsetOf(other: MixedSet): boolean {
    return (
      this.numberSet.isSubsetOf(other.numberSet) &&
      this.rangeSet.isSubsetOf(other.rangeSet)
    );
  }

  isSupersetOf(other: MixedSet): boolean {
    return (
      this.numberSet.isSupersetOf(other.numberSet) &&
      this.rangeSet.isSupersetOf(other.rangeSet)
    );
  }

  isEmpty(): boolean {
    return this.numberSet.isEmpty() && this.rangeSet.isEmpty();
  }

  isEqual(other: MixedSet): boolean {
    return (
      this.numberSet.isEqual(other.numberSet) &&
      this.rangeSet.isEqual(other.rangeSet)
    );
  }

  minX(): number | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    return Math.min(
      this.numberSet.min() ?? Infinity,
      this.rangeSet.min() ?? Infinity
    );
  }

  maxX(): number | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    return Math.max(
      this.numberSet.max() ?? -Infinity,
      this.rangeSet.max() ?? -Infinity
    );
  }
}
