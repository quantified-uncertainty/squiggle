import { OrderedMap } from "immutable";

import { REArgumentError } from "../errors/messages.js";
import { makeFnExample } from "../library/registry/core.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frAny,
  frArray,
  frBool,
  frDictWithArbitraryKeys,
  frLambdaTyped,
  frNamed,
  frNumber,
  frString,
  frTuple,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { Value } from "../value/index.js";
import { vString } from "../value/VString.js";

const maker = new FnFactory({
  nameSpace: "Dict",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "set",
    output: "Dict",
    examples: [makeFnExample(`Dict.set({a: 1, b: 2}, "c", 3)`)],
    displaySection: "Transformations",
    description:
      "Creates a new dictionary that includes the added element, while leaving the original dictionary unaltered.",
    definitions: [
      makeDefinition(
        [
          frDictWithArbitraryKeys(frAny({ genericName: "A" })),
          frNamed("key", frString),
          frNamed("value", frAny({ genericName: "A" })),
        ],
        frDictWithArbitraryKeys(frAny({ genericName: "A" })),
        ([dict, key, value]) => dict.set(key, value)
      ),
    ],
  }),
  maker.make({
    name: "has",
    output: "Bool",
    examples: [makeFnExample(`Dict.has({a: 1, b: 2}, "c")`)],
    displaySection: "Queries",
    definitions: [
      makeDefinition(
        [frDictWithArbitraryKeys(frAny()), frNamed("key", frString)],
        frBool,
        ([dict, key]) => dict.has(key)
      ),
    ],
  }),
  maker.make({
    name: "size",
    output: "Number",
    displaySection: "Queries",
    examples: [makeFnExample(`Dict.size({a: 1, b: 2})`)],
    definitions: [
      makeDefinition(
        [frDictWithArbitraryKeys(frAny())],
        frNumber,
        ([dict]) => dict.size
      ),
    ],
  }),
  maker.make({
    name: "delete",
    output: "Dict",
    examples: [makeFnExample(`Dict.delete({a: 1, b: 2}, "a")`)],
    description: "Creates a new dictionary that excludes the deleted element.",
    displaySection: "Transformations",
    definitions: [
      makeDefinition(
        [
          frDictWithArbitraryKeys(frAny({ genericName: "A" })),
          frNamed("key", frString),
        ],
        frDictWithArbitraryKeys(frAny({ genericName: "A" })),
        ([dict, key]) => dict.delete(key)
      ),
    ],
  }),
  maker.make({
    name: "merge",
    output: "Dict",
    examples: [
      makeFnExample(
        `first = { a: 1, b: 2 }
snd = { b: 3, c: 5 }
Dict.merge(first, snd)`
      ),
    ],
    displaySection: "Transformations",
    definitions: [
      makeDefinition(
        [frDictWithArbitraryKeys(frAny()), frDictWithArbitraryKeys(frAny())],
        frDictWithArbitraryKeys(frAny()),
        ([d1, d2]) => ImmutableMap([...d1.entries(), ...d2.entries()])
      ),
    ],
  }),
  maker.make({
    name: "mergeMany",
    output: "Dict",
    examples: [
      makeFnExample(
        `first = { a: 1, b: 2 }
snd = { b: 3, c: 5 }
Dict.mergeMany([first, snd]) // {a: 1, b: 3, c: 5}`
      ),
    ],
    displaySection: "Transformations",
    definitions: [
      makeDefinition(
        [frArray(frDictWithArbitraryKeys(frAny()))],
        frDictWithArbitraryKeys(frAny()),
        ([dicts]) => ImmutableMap(dicts.map((d) => [...d.entries()]).flat())
      ),
    ],
  }),
  maker.make({
    name: "keys",
    output: "Array",
    examples: [makeFnExample(`Dict.keys({a: 1, b: 2})`)],
    displaySection: "Queries",
    definitions: [
      makeDefinition(
        [frDictWithArbitraryKeys(frAny())],
        frArray(frString),
        ([d1]) => [...d1.keys()]
      ),
    ],
  }),
  maker.make({
    name: "values",
    output: "Array",
    examples: [makeFnExample(`Dict.values({ foo: 3, bar: 20 }) // [3, 20]`)],
    displaySection: "Queries",
    definitions: [
      makeDefinition(
        [frDictWithArbitraryKeys(frAny({ genericName: "A" }))],
        frArray(frAny({ genericName: "A" })),
        ([d1]) => [...d1.values()]
      ),
    ],
  }),
  maker.make({
    name: "toList",
    output: "Array",
    examples: [makeFnExample(`Dict.toList({a: 1, b: 2})`)],
    displaySection: "Conversions",
    definitions: [
      makeDefinition(
        [frDictWithArbitraryKeys(frAny({ genericName: "A" }))],
        frArray(frTuple(frString, frAny({ genericName: "A" }))),
        ([dict]) => [...dict.entries()]
      ),
    ],
  }),
  maker.make({
    name: "fromList",
    output: "Dict",
    examples: [
      makeFnExample(
        `Dict.fromList([
      ["foo", 3],
      ["bar", 20],
    ]) // {foo: 3, bar: 20}`
      ),
    ],
    displaySection: "Conversions",
    definitions: [
      makeDefinition(
        [frArray(frTuple(frString, frAny({ genericName: "A" })))],
        frDictWithArbitraryKeys(frAny({ genericName: "A" })),
        ([items]) => ImmutableMap(items)
      ),
    ],
  }),
  maker.make({
    name: "map",
    output: "Dict",
    examples: [makeFnExample(`Dict.map({a: 1, b: 2}, {|x| x + 1})`)],
    displaySection: "Transformations",
    definitions: [
      makeDefinition(
        [
          frDictWithArbitraryKeys(frAny({ genericName: "A" })),
          frNamed(
            "fn",
            frLambdaTyped(
              [frAny({ genericName: "A" })],
              frAny({ genericName: "B" })
            )
          ),
        ],
        frDictWithArbitraryKeys(frAny({ genericName: "B" })),
        ([dict, lambda], context) => {
          return ImmutableMap(
            [...dict.entries()].map(([key, value]) => {
              const mappedValue = context.call(lambda, [value]);
              return [key, mappedValue];
            })
          );
        }
      ),
    ],
  }),
  maker.make({
    name: "mapKeys",
    output: "Dict",
    examples: [
      makeFnExample(
        `Dict.mapKeys({a: 1, b: 2, c: 5}, {|x| concat(x, "-foobar")})`,
        { isInteractive: true }
      ),
    ],
    displaySection: "Transformations",
    definitions: [
      makeDefinition(
        [
          frDictWithArbitraryKeys(frAny({ genericName: "A" })),
          frNamed("fn", frLambdaTyped([frString], frString)),
        ],
        frDictWithArbitraryKeys(frAny({ genericName: "A" })),
        ([dict, lambda], context) => {
          const mappedEntries: [string, Value][] = [];
          for (const [key, value] of dict.entries()) {
            const mappedKey = context.call(lambda, [vString(key)]);

            if (mappedKey.type === "String") {
              mappedEntries.push([mappedKey.value, value]);
            } else {
              throw new REArgumentError("mapKeys: lambda must return a string");
            }
          }
          return ImmutableMap(mappedEntries);
        }
      ),
    ],
  }),
  maker.make({
    name: "pick",
    output: "Dict",
    examples: [
      makeFnExample(
        `data = { a: 1, b: 2, c: 3, d: 4 }
Dict.pick(data, ["a", "c"]) // {a: 1, c: 3}`
      ),
    ],
    description: "Creates a new dictionary that only includes the picked keys.",
    displaySection: "Queries",
    definitions: [
      makeDefinition(
        [
          frDictWithArbitraryKeys(frAny({ genericName: "A" })),
          frNamed("keys", frArray(frString)),
        ],
        frDictWithArbitraryKeys(frAny({ genericName: "A" })),
        ([dict, keys]) => {
          const response: OrderedMap<string, Value> = OrderedMap<
            string,
            Value
          >().withMutations((result) => {
            keys.forEach((key) => {
              const value = dict.get(key);
              if (dict.has(key) && value) {
                result.set(key, value);
              }
            });
          });
          return response;
        }
      ),
    ],
  }),
  maker.make({
    name: "omit",
    output: "Dict",
    examples: [
      makeFnExample(
        `data = { a: 1, b: 2, c: 3, d: 4 }
Dict.omit(data, ["b", "d"]) // {a: 1, c: 3}`
      ),
    ],
    description: "Creates a new dictionary that excludes the omitted keys.",
    displaySection: "Transformations",
    definitions: [
      makeDefinition(
        [
          frDictWithArbitraryKeys(frAny({ genericName: "A" })),
          frArray(frString),
        ],
        frNamed("keys", frDictWithArbitraryKeys(frAny({ genericName: "A" }))),
        ([dict, keys]) => {
          const response: OrderedMap<string, Value> = dict.withMutations(
            (result) => {
              keys.forEach((key) => {
                if (result.has(key)) {
                  result.delete(key);
                }
              });
            }
          );
          return response;
        }
      ),
    ],
  }),
];
