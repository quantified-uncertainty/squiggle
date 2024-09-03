#!/usr/bin/env node
import {
  EmbeddedRunner,
  makeSelfContainedLinker,
  removeLambdas,
  result,
  simpleValueFromAny,
  simpleValueToCompactString,
  SqErrorList,
  SqProject,
} from "@quri/squiggle-lang";

import { formatSquiggleCode } from "./formatSquiggleCode";
import { processSearchReplaceResponse } from "./searchReplace";
import { libraryContents } from "./squiggleLibraryHelpers";
import { CodeState } from "./StateExecution";

export const linkerWithDefaultSquiggleLibs = makeSelfContainedLinker(
  Object.fromEntries(libraryContents)
);

function summarizeAny(json: any): string {
  return simpleValueToCompactString(removeLambdas(simpleValueFromAny(json)));
}

type SqOutputSummary = {
  result: string;
  bindings: string;
};

const runSquiggle = async (
  code: string
): Promise<
  result<SqOutputSummary, { error: SqErrorList; project: SqProject }>
> => {
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
};

interface SquiggleRunResult {
  bindings: any;
  result: any;
}

interface ProcessSquiggleResult {
  codeState: CodeState;
  runResult: SquiggleRunResult | null;
}

export function diffToNewCode(
  completionContentWithDiff: string,
  oldCodeState: CodeState
): { okay: boolean; value: string } {
  if (oldCodeState.type === "noCode") {
    return { okay: false, value: "Didn't find any codeState code" };
  } else {
    const response = processSearchReplaceResponse(
      oldCodeState.code,
      completionContentWithDiff
    );
    return response.success
      ? { okay: true, value: response.value }
      : {
          okay: false,
          value: "Search and Replace Failed: " + response.value,
        };
  }
}

/*
 * Extracts Squiggle code from the content string.
 */
function extractSquiggleCode(content: string): string {
  if (!content || typeof content !== "string") {
    console.error("Invalid content provided to extractSquiggleCode:", content);
    return "";
  }
  const match = content.match(/```squiggle([\s\S]*?)```/);
  return match && match[1] ? match[1].trim() : "";
}

// Add this type guard function near the top of the file
function isErrorResult(
  value: SqOutputSummary | { error: SqErrorList; project: SqProject }
): value is { error: SqErrorList; project: SqProject } {
  return "error" in value && "project" in value;
}

export async function squiggleCodeToCodeStateViaRunningAndFormatting(
  code: string
): Promise<ProcessSquiggleResult> {
  // First, try running code and get errors
  const run = await runSquiggle(code);
  if (!run.ok) {
    if (isErrorResult(run.value)) {
      return {
        codeState: {
          type: "runFailed",
          code: code,
          error: run.value.error.errors[0],
          project: run.value.project,
        },
        runResult: null,
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
      codeState: { type: "formattingFailed", code, error: formattedCode.value },
      runResult: null,
    };
  }

  // If both formatting and running succeed
  return {
    codeState: { type: "success", code: formattedCode.value },
    runResult: run.value as SquiggleRunResult,
  };
}

export async function completionContentToCodeState(
  completionContent: string,
  codeState: CodeState,
  inputFormat: "generation" | "diff"
): Promise<{ okay: true; value: CodeState } | { okay: false; value: string }> {
  if (completionContent === "") {
    return { okay: false, value: "Received empty completion content" };
  }

  let newCode: string;

  switch (inputFormat) {
    case "generation": {
      newCode = extractSquiggleCode(completionContent);
      if (newCode === "") {
        return { okay: false, value: "Didn't get code from extraction" };
      }
      break;
    }
    case "diff": {
      const { okay, value } = diffToNewCode(completionContent, codeState);
      if (!okay) {
        return { okay: false, value: value };
      }
      newCode = value;
      break;
    }
  }

  const { codeState: newCodeState } =
    await squiggleCodeToCodeStateViaRunningAndFormatting(newCode);

  if (newCodeState.type === "noCode") {
    return { okay: false, value: "No code returned" };
  } else {
    return { okay: true, value: newCodeState };
  }
}
