import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frAny,
  frArray,
  frDict,
  frLambdaTyped,
  frNamed,
  frOptional,
  frString,
  frTableChart,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";

const maker = new FnFactory({
  nameSpace: "Table",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "make",
    output: "Plot",
    examples: [],
    definitions: [
      makeDefinition(
        [
          frNamed("data", frArray(frAny({ genericName: "A" }))),
          frNamed(
            "params",
            frDict([
              "columns",
              frArray(
                frDict(
                  ["fn", frLambdaTyped([frAny({ genericName: "A" })], frAny())],
                  ["name", frOptional(frString)]
                )
              ),
            ])
          ),
        ],
        frTableChart,
        ([data, params]) => {
          const { columns } = params ?? {};
          return {
            data,
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
            ["data", frArray(frAny({ genericName: "A" }))],
            [
              "columns",
              frArray(
                frDict(
                  ["fn", frLambdaTyped([frAny({ genericName: "A" })], frAny())],
                  ["name", frOptional(frString)]
                )
              ),
            ]
          ),
        ],
        frTableChart,
        ([{ data, columns }]) => {
          return {
            data,
            columns: columns.map(({ fn, name }) => ({
              fn,
              name: name ?? undefined,
            })),
          };
        },
        { deprecated: "0.8.7" }
      ),
    ],
  }),
];
