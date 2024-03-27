import { makeDefinition } from "../library/registry/fnDefinition.js";
import { frMixedSet } from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { MixedSet } from "../utility/MixedSet.js";

const maker = new FnFactory({
  nameSpace: "MixedSet",
  requiresNamespace: true,
});

function toDict(mixedShape: MixedSet) {
  return {
    points: mixedShape.points,
    segments: mixedShape.segments as [number, number][],
  };
}

export const library = [
  maker.make({
    name: "difference",
    requiresNamespace: true,
    definitions: [
      makeDefinition(
        [frMixedSet, frMixedSet],
        frMixedSet,
        ([first, second]) => {
          const _first = new MixedSet(first.points, first.segments);
          const _second = new MixedSet(second.points, second.segments);
          return toDict(_first.difference(_second));
        }
      ),
    ],
  }),
];
