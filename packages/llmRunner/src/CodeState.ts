import {
  EmbeddedRunner,
  makeSelfContainedLinker,
  removeLambdas,
  result,
  simpleValueFromAny,
  simpleValueToCompactString,
  SqError,
  SqErrorList,
  SqProject,
} from "@quri/squiggle-lang";

import { formatSquiggleCode } from "./formatSquiggleCode.js";
import { libraryContents } from "./squiggleLibraryHelpers.js";

export const llmLinker = makeSelfContainedLinker(
  Object.fromEntries(libraryContents)
);

// Evaluated code; source + result or error.
// Previously called CodeState.
// "ExecutedCode" or similar names would be too clunky; we often pass around
// "code + results" when we have both, so short name is more convenient.
export type Code =
  | {
      type: "formattingFailed";
      error: string;
      source: string;
    }
  | { type: "runFailed"; source: string; error: SqError; project: SqProject }
  | {
      type: "success";
      source: string;
      result: {
        bindings: string;
        result: string;
      };
    };

export function codeErrorString(code: Code): string {
  if (code.type === "formattingFailed") {
    return code.error;
  } else if (code.type === "runFailed") {
    return code.error.toStringWithDetails();
  }
  return "";
}

type SqOutputSummary = {
  result: string;
  bindings: string;
};

function summarizeAny(json: any): string {
  return simpleValueToCompactString(removeLambdas(simpleValueFromAny(json)));
}

async function runSquiggle(
  code: string
): Promise<
  result<SqOutputSummary, { error: SqErrorList; project: SqProject }>
> {
  const project = new SqProject({
    linker: llmLinker,
    runner: new EmbeddedRunner(),
  });

  project.setSimpleHead("main", code);
  const output = await project.waitForOutput("main");

  const endResult = output.getEndResult();
  const bindings = output.getBindings();
  if (endResult.ok && bindings.ok) {
    const outputJS: SqOutputSummary = {
      result: summarizeAny(endResult.value.asJS()),
      bindings: summarizeAny(bindings.value.asValue().asJS()),
    };
    return { ok: true, value: outputJS };
  } else {
    return {
      ok: false,
      value: { error: endResult.value as SqErrorList, project },
    };
  }
}

export async function codeStringToCode(code: string): Promise<Code> {
  // First, let's try to format the code.
  // If it fails we still attempt to run it, but because we format it first we
  // can be sure that run output matches the formatted version.
  const formattedCode = await formatSquiggleCode(code);

  const codeToRun = formattedCode.ok ? formattedCode.value : code;

  // Now let's run the code and get result or errors
  const run = await runSquiggle(codeToRun);
  if (!run.ok) {
    return {
      type: "runFailed",
      source: code,
      error: run.value.error.errors[0],
      project: run.value.project,
    };
  }

  if (formattedCode.ok) {
    return {
      type: "success",
      source: codeToRun,
      result: run.value,
    };
  } else {
    // that's weird, formatting failed but running succeeded
    return {
      type: "formattingFailed",
      source: code,
      error: formattedCode.value,
    };
  }
}
