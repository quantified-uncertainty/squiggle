import { linter } from "@codemirror/lint";
import { Extension, Facet } from "@codemirror/state";

import {
  SqCompileError,
  SqError,
  SqImportError,
  SqRuntimeError,
} from "@quri/squiggle-lang";

import { Simulation } from "../../lib/hooks/useSimulator.js";
import { simulationErrors } from "../../lib/utility.js";
import { simulationFacet } from "./fields.js";

export function errorsExtension(): Extension {
  const errorsFacet = Facet.define<Simulation | null, SqError[]>({
    combine: (value) => {
      if (!value.length || !value[0]) return [];
      const simulation = value[0];
      return simulationErrors(simulation);
    },
  });

  return [
    errorsFacet.compute([simulationFacet], (state) =>
      state.facet(simulationFacet)
    ),
    linter(
      (view) => {
        const errors = view.state.facet(errorsFacet) ?? [];
        const docLength = view.state.doc.length;

        const diagnostics = errors
          .map((err) => {
            if (
              !(
                err instanceof SqCompileError ||
                err instanceof SqRuntimeError ||
                err instanceof SqImportError
              )
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
            return (
              !!err && err.location && err.location.end.offset <= docLength
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
        needsRefresh: ({ startState, state }) =>
          startState.facet(errorsFacet) !== state.facet(errorsFacet),
      }
    ),
  ];
}
