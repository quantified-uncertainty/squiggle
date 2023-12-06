import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frAny,
  frArray,
  frBoxed,
  frDict,
  frGeneric,
  frLambdaTyped,
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
          frBoxed(frArray(frGeneric("A"))),
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
        ([[params, data], { title, columns }]) => {
          return makeTableChart(
            data,
            nullToUndefined(columns),
            nullToUndefined(title)
          );
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
            nullToUndefined(columns),
            nullToUndefined(title)
          );
        }
      ),
    ],
  }),
];
