import { OrderedMap } from "immutable";
import { REArgumentError } from "../errors/messages.js";
import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frAny,
  frArray,
  frBool,
  frDictWithArbitraryKeys,
  frGeneric,
  frLambdaTyped,
  frNumber,
  frString,
  frTuple,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import {
  Value,
  vArray,
  vNumber,
  vBool,
  vDict,
  vString,
} from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Dict",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "set",
    output: "Dict",
    examples: [`Dict.set({a: 1, b: 2}, "c", 3)`],
    definitions: [
      makeDefinition(
        [frDictWithArbitraryKeys(frGeneric("A")), frString, frGeneric("A")],
        ([dict, key, value]) => vDict(dict.set(key, value)),
        frDictWithArbitraryKeys(frGeneric("A"))
      ),
    ],
  }),
  maker.make({
    name: "has",
    output: "Bool",
    examples: [`Dict.has({a: 1, b: 2}, "c")`],
    definitions: [
      makeDefinition(
        [frDictWithArbitraryKeys(frAny), frString],
        ([dict, key]) => vBool(dict.has(key)),
        frBool
      ),
    ],
  }),
  maker.make({
    name: "size",
    output: "Number",
    examples: [`Dict.size({a: 1, b: 2})`],
    definitions: [
      makeDefinition(
        [frDictWithArbitraryKeys(frAny)],
        ([dict]) => vNumber(dict.size),
        frNumber
      ),
    ],
  }),
  maker.make({
    name: "delete",
    output: "Dict",
    examples: [`Dict.delete({a: 1, b: 2}, "a")`],
    definitions: [
      makeDefinition(
        [frDictWithArbitraryKeys(frGeneric("A")), frString],
        ([dict, key]) => vDict(dict.delete(key)),
        frDictWithArbitraryKeys(frGeneric("A"))
      ),
    ],
  }),
  maker.make({
    name: "merge",
    output: "Dict",
    examples: [`Dict.merge({a: 1, b: 2}, {c: 3, d: 4})`],
    definitions: [
      makeDefinition(
        [frDictWithArbitraryKeys(frAny), frDictWithArbitraryKeys(frAny)],
        ([d1, d2]) => vDict(ImmutableMap([...d1.entries(), ...d2.entries()])),
        frDictWithArbitraryKeys(frAny)
      ),
    ],
  }),
  maker.make({
    name: "mergeMany",
    output: "Dict",
    examples: [`Dict.mergeMany([{a: 1, b: 2}, {c: 3, d: 4}])`],
    definitions: [
      makeDefinition(
        [frArray(frDictWithArbitraryKeys(frAny))],
        ([dicts]) =>
          vDict(ImmutableMap(dicts.map((d) => [...d.entries()]).flat())),
        frDictWithArbitraryKeys(frAny)
      ),
    ],
  }),
  maker.make({
    name: "keys",
    output: "Array",
    examples: [`Dict.keys({a: 1, b: 2})`],
    definitions: [
      makeDefinition(
        [frDictWithArbitraryKeys(frAny)],
        ([d1]) => vArray([...d1.keys()].map((k) => vString(k))),
        frArray(frString)
      ),
    ],
  }),
  maker.make({
    name: "values",
    output: "Array",
    examples: [`Dict.values({a: 1, b: 2})`],
    definitions: [
      makeDefinition(
        [frDictWithArbitraryKeys(frGeneric("A"))],
        ([d1]) => vArray([...d1.values()]),
        frArray(frGeneric("A"))
      ),
    ],
  }),
  maker.make({
    name: "toList",
    output: "Array",
    examples: [`Dict.toList({a: 1, b: 2})`],
    definitions: [
      makeDefinition(
        [frDictWithArbitraryKeys(frGeneric("A"))],
        ([dict]) =>
          vArray([...dict.entries()].map(([k, v]) => vArray([vString(k), v]))),
        frDictWithArbitraryKeys(frGeneric("A"))
      ),
    ],
  }),
  maker.make({
    name: "fromList",
    output: "Dict",
    examples: [`Dict.fromList([["a", 1], ["b", 2]])`],
    definitions: [
      makeDefinition(
        [frArray(frTuple(frString, frGeneric("A")))],
        ([items]) => vDict(ImmutableMap(items)),
        frDictWithArbitraryKeys(frGeneric("A"))
      ),
    ],
  }),
  maker.make({
    name: "map",
    output: "Dict",
    examples: [`Dict.map({a: 1, b: 2}, {|x| x + 1})`],
    definitions: [
      makeDefinition(
        [
          frDictWithArbitraryKeys(frGeneric("A")),
          frLambdaTyped([frGeneric("A")], frGeneric("B")),
        ],
        ([dict, lambda], context) => {
          return vDict(
            ImmutableMap(
              [...dict.entries()].map(([key, value]) => {
                const mappedValue = lambda.call([value], context);
                return [key, mappedValue];
              })
            )
          );
        },
        frDictWithArbitraryKeys(frGeneric("B"))
      ),
    ],
  }),
  maker.make({
    name: "mapKeys",
    output: "Dict",
    examples: [`Dict.mapKeys({a: 1, b: 2}, {|x| concat(x, "-1")})`],
    definitions: [
      makeDefinition(
        [
          frDictWithArbitraryKeys(frGeneric("A")),
          frLambdaTyped([frString], frString),
        ],
        ([dict, lambda], context) => {
          const mappedEntries: [string, Value][] = [];
          for (const [key, value] of dict.entries()) {
            const mappedKey = lambda.call([vString(key)], context);

            if (mappedKey.type === "String") {
              mappedEntries.push([mappedKey.value, value]);
            } else {
              throw new REArgumentError("mapKeys: lambda must return a string");
            }
          }
          return vDict(ImmutableMap(mappedEntries));
        },
        frDictWithArbitraryKeys(frGeneric("A"))
      ),
    ],
  }),
  maker.make({
    name: "pick",
    output: "Dict",
    examples: [`Dict.pick({a: 1, b: 2, c: 3}, ['a', 'c'])`],
    definitions: [
      makeDefinition(
        [frDictWithArbitraryKeys(frGeneric("A")), frArray(frString)],
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
          return vDict(response);
        },
        frDictWithArbitraryKeys(frGeneric("A"))
      ),
    ],
  }),
  maker.make({
    name: "omit",
    output: "Dict",
    examples: [`Dict.omit({a: 1, b: 2, c: 3}, ['b'])`],
    definitions: [
      makeDefinition(
        [frDictWithArbitraryKeys(frGeneric("A")), frArray(frString)],
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
          return vDict(response);
        },
        frDictWithArbitraryKeys(frGeneric("A"))
      ),
    ],
  }),
];
