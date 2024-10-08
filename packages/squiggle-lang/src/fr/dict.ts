import { OrderedMap } from "immutable";

import { ErrorMessage } from "../errors/messages.js";
import { namedInput } from "../library/FrInput.js";
import {
  frAny,
  frArray,
  frBool,
  frDictWithArbitraryKeys,
  frNumber,
  frString,
  frTuple,
  frTypedLambda,
} from "../library/FrType.js";
import { makeFnExample } from "../library/registry/core.js";
import { FnFactory } from "../library/registry/helpers.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";
import { tAny, tString } from "../types/index.js";
import { ImmutableMap } from "../utility/immutable.js";
import { Value } from "../value/index.js";
import { vString } from "../value/VString.js";

const maker = new FnFactory({
  nameSpace: "Dict",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "set",
    examples: [makeFnExample(`Dict.set({a: 1, b: 2}, "c", 3)`)],
    displaySection: "Transformations",
    description:
      "Creates a new dictionary that includes the added element, while leaving the original dictionary unaltered.",
    definitions: [
      makeDefinition(
        [
          frDictWithArbitraryKeys(frAny({ genericName: "A" })),
          namedInput("key", frString),
          namedInput("value", frAny({ genericName: "A" })),
        ],
        frDictWithArbitraryKeys(frAny({ genericName: "A" })),
        ([dict, key, value]) => dict.set(key, value)
      ),
    ],
  }),
  maker.make({
    name: "has",
    examples: [makeFnExample(`Dict.has({a: 1, b: 2}, "c")`)],
    displaySection: "Queries",
    definitions: [
      makeDefinition(
        [frDictWithArbitraryKeys(frAny()), namedInput("key", frString)],
        frBool,
        ([dict, key]) => dict.has(key)
      ),
    ],
  }),
  maker.make({
    name: "size",
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
    examples: [makeFnExample(`Dict.delete({a: 1, b: 2}, "a")`)],
    description: "Creates a new dictionary that excludes the deleted element.",
    displaySection: "Transformations",
    definitions: [
      makeDefinition(
        [
          frDictWithArbitraryKeys(frAny({ genericName: "A" })),
          namedInput("key", frString),
        ],
        frDictWithArbitraryKeys(frAny({ genericName: "A" })),
        ([dict, key]) => dict.delete(key)
      ),
    ],
  }),
  maker.make({
    name: "merge",
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
    examples: [makeFnExample(`Dict.map({a: 1, b: 2}, {|x| x + 1})`)],
    displaySection: "Transformations",
    definitions: [
      makeDefinition(
        [
          frDictWithArbitraryKeys(frAny({ genericName: "A" })),
          namedInput(
            "fn",
            frTypedLambda(
              [tAny({ genericName: "A" })],
              tAny({ genericName: "B" })
            )
          ),
        ],
        frDictWithArbitraryKeys(frAny({ genericName: "B" })),
        ([dict, lambda], reducer) => {
          return ImmutableMap(
            [...dict.entries()].map(([key, value]) => {
              const mappedValue = reducer.call(lambda, [value]);
              return [key, mappedValue];
            })
          );
        }
      ),
    ],
  }),
  maker.make({
    name: "mapKeys",
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
          namedInput("fn", frTypedLambda([tString], tString)),
        ],
        frDictWithArbitraryKeys(frAny({ genericName: "A" })),
        ([dict, lambda], reducer) => {
          const mappedEntries: [string, Value][] = [];
          for (const [key, value] of dict.entries()) {
            const mappedKey = reducer.call(lambda, [vString(key)]);

            if (mappedKey.type === "String") {
              mappedEntries.push([mappedKey.value, value]);
            } else {
              throw ErrorMessage.argumentError(
                "mapKeys: lambda must return a string"
              );
            }
          }
          return ImmutableMap(mappedEntries);
        }
      ),
    ],
  }),
  maker.make({
    name: "pick",
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
          namedInput("keys", frArray(frString)),
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
          namedInput("keys", frArray(frString)),
        ],
        frDictWithArbitraryKeys(frAny({ genericName: "A" })),
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
