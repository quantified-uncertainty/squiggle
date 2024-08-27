#!/usr/bin/env node
import {
  removeLambdas,
  result,
  simpleValueFromAny,
  SqError,
  SqLinker,
  SqProject,
  summarizeSimpleValueWithoutLambda,
} from "@quri/squiggle-lang";

import { formatSquiggleCode } from "./formatSquiggleCode";
import { getLibraryContent } from "./libraryConfig";
import { processSearchReplaceResponse } from "./searchReplace";
import { CodeState } from "./stateManager";

export const linker: SqLinker = {
  resolve: (name: string) => name,
  loadSource: async (sourceName: string) => getLibraryContent(sourceName),
};

function summarizeAny(json: any): string {
  return summarizeSimpleValueWithoutLambda(
    removeLambdas(simpleValueFromAny(json)),
    0,
    6
  );
}

type SqOutputSummary = {
  result: string;
  bindings: string;
};

const runSquiggle = async (
  code: string
): Promise<
  Promise<result<SqOutputSummary, { error: SqError; project: SqProject }>>
> => {
  const project = SqProject.create({ linker: linker });
  project.setSource("wrapper", code);
  await project.run("wrapper");
  const output = project.getOutput("wrapper");

  if (output.ok) {
    const outputJS: SqOutputSummary = {
      result: summarizeAny(output.value.result.asJS()),
      bindings: summarizeAny(output.value.bindings.asValue().asJS()),
    };
    return { ok: true, value: outputJS };
  } else {
    return {
      ok: false,
      value: { error: output.value as SqError, project },
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
  value: SqOutputSummary | { error: SqError; project: SqProject }
): value is { error: SqError; project: SqProject } {
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
          error: run.value.error,
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

  if (inputFormat === "generation") {
    newCode = extractSquiggleCode(completionContent);
    if (newCode === "") {
      return { okay: false, value: "Didn't get code from extraction" };
    }
  } else if (inputFormat === "diff") {
    const { okay, value } = diffToNewCode(completionContent, codeState);
    if (!okay) {
      return { okay: false, value: value };
    }
    newCode = value;
  }

  const { codeState: newCodeState } =
    await squiggleCodeToCodeStateViaRunningAndFormatting(newCode);

  if (newCodeState.type === "noCode") {
    return { okay: false, value: "No code returned" };
  } else {
    return { okay: true, value: newCodeState };
  }
}
