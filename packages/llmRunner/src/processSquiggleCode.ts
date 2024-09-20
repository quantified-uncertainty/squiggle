import { result } from "@quri/squiggle-lang";

import { Code, codeStringToCode } from "./CodeState.js";
import { processSearchReplaceResponse } from "./searchReplace.js";

export function diffToNewCode(
  completionContentWithDiff: string,
  oldCodeState: Code
): result<string, string> {
  const response = processSearchReplaceResponse(
    oldCodeState.source,
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
 * Extracts Squiggle source code from the content string.
 */
function extractSquiggleSource(content: string): string {
  if (!content || typeof content !== "string") {
    console.error(
      "Invalid content provided to extractSquiggleSource:",
      content
    );
    return "";
  }
  const match = content.match(/```squiggle([\s\S]*?)```/);
  return match && match[1] ? match[1].trim() : "";
}

export async function generationCompletionContentToCode(
  completionContent: string
): Promise<result<Code, string>> {
  if (completionContent === "") {
    return { ok: false, value: "Received empty completion content" };
  }

  const newCode = extractSquiggleSource(completionContent);
  if (newCode === "") {
    return { ok: false, value: "Didn't get code from extraction" };
  }

  return { ok: true, value: await codeStringToCode(newCode) };
}

export async function diffCompletionContentToCode(
  completionContent: string,
  code: Code
): Promise<result<Code, string>> {
  if (completionContent === "") {
    return { ok: false, value: "Received empty completion content" };
  }

  const { ok, value } = diffToNewCode(completionContent, code);
  if (!ok) {
    return { ok: false, value };
  }

  return { ok: true, value: await codeStringToCode(value) };
}
