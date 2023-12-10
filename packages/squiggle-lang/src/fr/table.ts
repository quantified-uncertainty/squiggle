import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frAny,
  frArray,
  frForceBoxed,
  frDict,
  frGeneric,
  frLambdaTyped,
  frNamed,
  frOptional,
  frString,
  frTableChart,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { Lambda } from "../reducer/lambda.js";
import { Value } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Table",
  requiresNamespace: true,
});

function makeTableChart(
  data: readonly Value[],
  columns?: readonly { fn: Lambda; name?: string | null }[],
  title?: string
): any {
  return {
    data,
    title: title || undefined,
    columns: columns?.map(({ fn, name }) => ({
      fn,
      name: name ?? undefined,
    })),
  };
}

function nullToUndefined<T>(a: T | null): T | undefined {
  return a === null ? undefined : a;
}

export const library = [
  maker.make({
    name: "make",
    output: "Plot",
    examples: [],
    definitions: [
      makeDefinition(
        [
          frNamed("data", frForceBoxed(frArray(frGeneric("A")))),
          frDict(
            ["title", frOptional(frString)],
            [
              "columns",
              frArray(
                frDict(
                  ["fn", frLambdaTyped([frGeneric("A")], frAny)],
                  ["name", frOptional(frString)]
                )
              ),
            ]
          ),
        ],
        frTableChart,
        ([{ value, args }, params]) => {
          const { title, columns } = params ?? {};
          return {
            data: value,
            title: title || args.name() || undefined,
            columns: columns.map(({ fn, name }) => ({
              fn,
              name: name ?? undefined,
            })),
          };
        }
      ),
      makeDefinition(
        [
          frDict(
            ["data", frArray(frGeneric("A"))],
            ["title", frOptional(frString)],
            [
              "columns",
              frArray(
                frDict(
                  ["fn", frLambdaTyped([frGeneric("A")], frAny)],
                  ["name", frOptional(frString)]
                )
              ),
            ]
          ),
        ],
        frTableChart,
        ([{ data, title, columns }]) => {
          return makeTableChart(
            data,
            columns.map(({ fn, name }) => ({
              fn,
              name: name ?? undefined,
            })),
            title || undefined
          );
        },
        { deprecated: "0.8.7" }
      ),
    ],
  }),
];
