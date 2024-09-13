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

// Add this type guard function near the top of the file
function isErrorResult(
  value: SqOutputSummary | { error: SqErrorList; project: SqProject }
): value is { error: SqErrorList; project: SqProject } {
  return "error" in value && "project" in value;
}

export async function codeToCodeState(code: string): Promise<CodeState> {
  // First, try running code and get errors
  const run = await runSquiggle(code);
  if (!run.ok) {
    if (isErrorResult(run.value)) {
      return {
        type: "runFailed",
        code,
        error: run.value.error.errors[0],
        project: run.value.project,
      };
    } else {
      // This should never happen, but we need to handle it for TypeScript
      throw new Error("Unexpected error result structure");
    }
  }

  // If that works, then try formatting code
  const formattedCode = await formatSquiggleCode(code);
  if (!formattedCode.ok) {
    return {
      type: "formattingFailed",
      code,
      error: formattedCode.value,
    };
  }

  // If both formatting and running succeed
  return {
    type: "success",
    code: formattedCode.value,
    result: run.value,
  };
}
