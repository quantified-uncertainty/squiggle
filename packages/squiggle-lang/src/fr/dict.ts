import { makeDefinition } from "../library/registry/fnDefinition";
import {
  frAny,
  frArray,
  frDict,
  frLambda,
  frString,
  frTuple2,
} from "../library/registry/frTypes";
import { FnFactory } from "../library/registry/helpers";
import { Ok } from "../utility/result";
import { ImmutableMap } from "../utility/immutableMap";
import { vArray, vRecord, vString } from "../value";

const maker = new FnFactory({
  nameSpace: "Dict",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "set",
    output: "Record",
    examples: [`Dict.set({a: 1, b: 2}, "c", 3)`],
    definitions: [
      makeDefinition(
        "set",
        [frDict(frAny), frString, frAny],
        ([dict, key, value]) => Ok(vRecord(dict.set(key, value)))
      ),
    ],
  }),
  maker.make({
    name: "merge",
    output: "Record",
    examples: [`Dict.merge({a: 1, b: 2}, {c: 3, d: 4})`],
    definitions: [
      makeDefinition("merge", [frDict(frAny), frDict(frAny)], ([d1, d2]) =>
        Ok(vRecord(ImmutableMap([...d1.entries(), ...d2.entries()])))
      ),
    ],
  }),
  maker.make({
    name: "mergeMany",
    output: "Record",
    examples: [`Dict.mergeMany([{a: 1, b: 2}, {c: 3, d: 4}])`],
    definitions: [
      makeDefinition("mergeMany", [frArray(frDict(frAny))], ([dicts]) =>
        Ok(vRecord(ImmutableMap(dicts.map((d) => [...d.entries()]).flat())))
      ),
    ],
  }),
  maker.make({
    name: "keys",
    output: "Array",
    examples: [`Dict.keys({a: 1, b: 2})`],
    definitions: [
      makeDefinition("keys", [frDict(frAny)], ([d1]) =>
        Ok(vArray([...d1.keys()].map((k) => vString(k))))
      ),
    ],
  }),
  maker.make({
    name: "values",
    output: "Array",
    examples: [`Dict.values({a: 1, b: 2})`],
    definitions: [
      makeDefinition("values", [frDict(frAny)], ([d1]) =>
        Ok(vArray([...d1.values()]))
      ),
    ],
  }),
  maker.make({
    name: "toList",
    output: "Array",
    examples: [`Dict.toList({a: 1, b: 2})`],
    definitions: [
      makeDefinition("toList", [frDict(frAny)], ([dict]) =>
        Ok(vArray([...dict.entries()].map(([k, v]) => vArray([vString(k), v]))))
      ),
    ],
  }),
  maker.make({
    name: "fromList",
    output: "Record",
    examples: [`Dict.fromList([["a", 1], ["b", 2]])`],
    definitions: [
      makeDefinition(
        "fromList",
        [frArray(frTuple2(frString, frAny))],
        ([items]) => Ok(vRecord(ImmutableMap(items)))
      ),
    ],
  }),
  maker.make({
    name: "map",
    output: "Record",
    examples: [`Dict.map({a: 1, b: 2}, {|x| x + 1})`],
    definitions: [
      makeDefinition(
        "map",
        [frDict(frAny), frLambda],
        ([dict, lambda], context, reducer) => {
          return Ok(
            vRecord(
              ImmutableMap(
                [...dict.entries()].map(([key, value]) => {
                  const mappedValue = lambda.call([value], context, reducer);
                  return [key, mappedValue];
                })
              )
            )
          );
        }
      ),
    ],
  }),
];
