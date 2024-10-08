import { frBool, frMixedSet, frNumber } from "../library/FrType.js";
import { FnFactory } from "../library/registry/helpers.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";
import { MixedSet } from "../utility/MixedSet.js";

const maker = new FnFactory({
  nameSpace: "MixedSet",
  requiresNamespace: true,
});

function toDict(mixedShape: MixedSet) {
  return {
    points: mixedShape.numberSet.numbers,
    segments: mixedShape.rangeSet.ranges as [number, number][],
  };
}

function fromDict(
  dict: {
    points: readonly number[];
  } & {
    segments: readonly [number, number][];
  }
) {
  return new MixedSet(dict.points, dict.segments);
}

export const library = [
  maker.make({
    name: "difference",
    definitions: [
      makeDefinition([frMixedSet, frMixedSet], frMixedSet, ([m1, m2]) => {
        return toDict(fromDict(m1).difference(fromDict(m2)));
      }),
    ],
  }),
  maker.make({
    name: "intersection",
    definitions: [
      makeDefinition([frMixedSet, frMixedSet], frMixedSet, ([m1, m2]) => {
        return toDict(fromDict(m1).intersection(fromDict(m2)));
      }),
    ],
  }),
  maker.make({
    name: "union",
    definitions: [
      makeDefinition([frMixedSet, frMixedSet], frMixedSet, ([m1, m2]) => {
        return toDict(fromDict(m1).union(fromDict(m2)));
      }),
    ],
  }),
  maker.make({
    name: "isSubsetOf",
    definitions: [
      makeDefinition([frMixedSet, frMixedSet], frBool, ([m1, m2]) => {
        return fromDict(m1).isSubsetOf(fromDict(m2));
      }),
    ],
  }),
  maker.make({
    name: "isSupersetOf",
    definitions: [
      makeDefinition([frMixedSet, frMixedSet], frBool, ([m1, m2]) => {
        return fromDict(m1).isSupersetOf(fromDict(m2));
      }),
    ],
  }),
  maker.make({
    name: "isEqual",
    definitions: [
      makeDefinition([frMixedSet, frMixedSet], frBool, ([m1, m2]) => {
        return fromDict(m1).isEqual(fromDict(m2));
      }),
    ],
  }),
  maker.make({
    name: "isEmpty",
    definitions: [
      makeDefinition([frMixedSet], frBool, ([m]) => {
        return fromDict(m).isEmpty();
      }),
    ],
  }),
  maker.make({
    name: "min",
    description: "Returns the minimum value in the set",
    definitions: [
      makeDefinition([frMixedSet], frNumber, ([m]) => {
        const min = fromDict(m).min();
        if (min === undefined) {
          throw new Error("Set is Empty");
        }
        return min;
      }),
    ],
  }),
  maker.make({
    name: "max",
    description: "Returns the maximum value in the set",
    definitions: [
      makeDefinition([frMixedSet], frNumber, ([m]) => {
        const max = fromDict(m).max();
        if (max === undefined) {
          throw new Error("Set is Empty");
        }
        return max;
      }),
    ],
  }),
];
