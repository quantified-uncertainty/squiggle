import { makeDefinition } from "../library/registry/fnDefinition.js";
import { FnFactory } from "../library/registry/helpers.js";
import { tBool, tMixedSet, tNumber } from "../types/index.js";
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
      makeDefinition([tMixedSet, tMixedSet], tMixedSet, ([m1, m2]) => {
        return toDict(fromDict(m1).difference(fromDict(m2)));
      }),
    ],
  }),
  maker.make({
    name: "intersection",
    definitions: [
      makeDefinition([tMixedSet, tMixedSet], tMixedSet, ([m1, m2]) => {
        return toDict(fromDict(m1).intersection(fromDict(m2)));
      }),
    ],
  }),
  maker.make({
    name: "union",
    definitions: [
      makeDefinition([tMixedSet, tMixedSet], tMixedSet, ([m1, m2]) => {
        return toDict(fromDict(m1).union(fromDict(m2)));
      }),
    ],
  }),
  maker.make({
    name: "isSubsetOf",
    definitions: [
      makeDefinition([tMixedSet, tMixedSet], tBool, ([m1, m2]) => {
        return fromDict(m1).isSubsetOf(fromDict(m2));
      }),
    ],
  }),
  maker.make({
    name: "isSupersetOf",
    definitions: [
      makeDefinition([tMixedSet, tMixedSet], tBool, ([m1, m2]) => {
        return fromDict(m1).isSupersetOf(fromDict(m2));
      }),
    ],
  }),
  maker.make({
    name: "isEqual",
    definitions: [
      makeDefinition([tMixedSet, tMixedSet], tBool, ([m1, m2]) => {
        return fromDict(m1).isEqual(fromDict(m2));
      }),
    ],
  }),
  maker.make({
    name: "isEmpty",
    definitions: [
      makeDefinition([tMixedSet], tBool, ([m]) => {
        return fromDict(m).isEmpty();
      }),
    ],
  }),
  maker.make({
    name: "min",
    description: "Returns the minimum value in the set",
    definitions: [
      makeDefinition([tMixedSet], tNumber, ([m]) => {
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
      makeDefinition([tMixedSet], tNumber, ([m]) => {
        const max = fromDict(m).max();
        if (max === undefined) {
          throw new Error("Set is Empty");
        }
        return max;
      }),
    ],
  }),
];
