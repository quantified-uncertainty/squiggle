import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frAny,
  frArray,
  frDict,
  frForceBoxed,
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
      //We're not using the Table title here, because we want to phase it out.
      makeDefinition(
        [
          frNamed("data", frForceBoxed(frArray(frAny({ genericName: "A" })))),
          frDict([
            "columns",
            frArray(
              frDict(
                ["fn", frLambdaTyped([frAny({ genericName: "A" })], frAny())],
                ["name", frOptional(frString)]
              )
            ),
          ]),
        ],
        frTableChart,
        ([{ value, args }, params]) => {
          const { columns } = params ?? {};
          return {
            data: value,
            columns: columns.map(({ fn, name }) => ({
              fn,
              name: name ?? args.name() ?? undefined,
            })),
          };
        }
      ),
      makeDefinition(
        [
          frDict(
            ["data", frArray(frAny({ genericName: "A" }))],
            ["title", frOptional(frString)],
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
        ([{ data, title, columns }]) => {
          return {
            data,
            title: title || undefined,
            columns: columns?.map(({ fn, name }) => ({
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
