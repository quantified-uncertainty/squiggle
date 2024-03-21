import { makeDefinition } from "../library/registry/fnDefinition.js";
import { frMixedSet } from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { MixedSet } from "../utility/MixedSet.js";

const maker = new FnFactory({
  nameSpace: "MixedSet",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "subtract",
    requiresNamespace: false,
    definitions: [
      makeDefinition(
        [frMixedSet, frMixedSet],
        frMixedSet,
        ([first, second]) => {
          const _first = new MixedSet(
            first.points as number[],
            first.segments as [number, number][]
          );
          const _second = new MixedSet(
            second.points as number[],
            second.segments as [number, number][]
          );
          return _first.subtract(_second);
        }
      ),
    ],
  }),
];
