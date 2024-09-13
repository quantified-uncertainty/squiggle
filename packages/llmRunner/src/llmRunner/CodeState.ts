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

import { formatSquiggleCode } from "./formatSquiggleCode";
import { libraryContents } from "./squiggleLibraryHelpers";

export const linkerWithDefaultSquiggleLibs = makeSelfContainedLinker(
  Object.fromEntries(libraryContents)
);

export type CodeState =
  | {
      type: "formattingFailed";
      error: string;
      code: string;
    }
  | { type: "runFailed"; code: string; error: SqError; project: SqProject }
  | {
      type: "success";
      code: string;
      result: {
        bindings: string;
        result: string;
      };
    };

export function codeStateErrorString(codeState: CodeState): string {
  if (codeState.type === "formattingFailed") {
    return codeState.error;
  } else if (codeState.type === "runFailed") {
    return codeState.error.toStringWithDetails();
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
    linker: linkerWithDefaultSquiggleLibs,
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

export async function codeToCodeState(code: string): Promise<CodeState> {
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
      code,
      error: run.value.error.errors[0],
      project: run.value.project,
    };
  }

  if (formattedCode.ok) {
    return {
      type: "success",
      code: codeToRun,
      result: run.value,
    };
  } else {
    // that's weird, formatting failed but running succeeded
    return {
      type: "formattingFailed",
      code,
      error: formattedCode.value,
    };
  }
}
