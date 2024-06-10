import { linter } from "@codemirror/lint";
import { Extension, Facet } from "@codemirror/state";

import { SqCompileError, SqError, SqRuntimeError } from "@quri/squiggle-lang";

import { Simulation } from "../../lib/hooks/useSimulator.js";
import { simulationErrors } from "../../lib/utility.js";
import { reactPropsEffect, simulationFacet } from "./fields.js";

const errorsFacet = Facet.define<Simulation | null, SqError[]>({
  combine: (value) => {
    if (!value.length || !value[0]) return [];
    const simulation = value[0];
    return simulationErrors(simulation);
  },
});

export function errorsExtension(): Extension {
  return [
    errorsFacet.compute([simulationFacet.facet], (state) =>
      state.facet(simulationFacet.facet)
    ),
    linter(
      (view) => {
        const errors = view.state.facet(errorsFacet) ?? [];
        const docLength = view.state.doc.length;

        const diagnostics = errors
          .map((err) => {
            if (
              !(err instanceof SqCompileError || err instanceof SqRuntimeError)
            ) {
              return undefined;
            }
            const location = err.location();
            if (!location) {
              return undefined;
            }
            return {
              location,
              err,
            };
          })
          .filter((err): err is NonNullable<typeof err> => {
            return Boolean(
              err && err.location && err.location.end.offset <= docLength
            );
          })
          .map((err) => ({
            from: err.location.start.offset,
            to: err.location.end.offset,
            severity: "error" as const,
            message: err.err.toString(),
          }));
        return diagnostics;
      },
      {
        delay: 0,
        needsRefresh: ({ transactions }) => {
          // When the new react props arrive (including `errors` field), it's applied in `useEffect` and then becomes available through facet.
          for (const tr of transactions) {
            for (const e of tr.effects) if (e.is(reactPropsEffect)) return true;
          }
          return false;
        },
      }
    ),
    simulationFacet.extension,
  ];
}
