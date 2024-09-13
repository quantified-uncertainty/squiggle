import { result } from "@quri/squiggle-lang";

import { CodeState, codeToCodeState } from "./CodeState";
import { processSearchReplaceResponse } from "./searchReplace";

export function diffToNewCode(
  completionContentWithDiff: string,
  oldCodeState: CodeState
): result<string, string> {
  const response = processSearchReplaceResponse(
    oldCodeState.code,
    completionContentWithDiff
  );
  return response.success
    ? { ok: true, value: response.value }
    : {
        ok: false,
        value: "Search and Replace Failed: " + response.value,
      };
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

export async function generationCompletionContentToCodeState(
  completionContent: string
): Promise<result<CodeState, string>> {
  if (completionContent === "") {
    return { ok: false, value: "Received empty completion content" };
  }

  const newCode = extractSquiggleCode(completionContent);
  if (newCode === "") {
    return { ok: false, value: "Didn't get code from extraction" };
  }

  return { ok: true, value: await codeToCodeState(newCode) };
}

export async function diffCompletionContentToCodeState(
  completionContent: string,
  codeState: CodeState
): Promise<result<CodeState, string>> {
  if (completionContent === "") {
    return { ok: false, value: "Received empty completion content" };
  }

  const { ok, value } = diffToNewCode(completionContent, codeState);
  if (!ok) {
    return { ok: false, value };
  }

  return { ok: true, value: await codeToCodeState(value) };
}
