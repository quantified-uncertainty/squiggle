import * as prettier from "prettier/standalone";

import * as prettierSquigglePlugin from "@quri/prettier-plugin-squiggle";
import { result } from "@quri/squiggle-lang";

import { makeAutomaticChanges } from "./squiggleAutomaticChanges.js";

//This is moved in its own file, because the prettier plugin causes issues with the tests.
export async function formatSquiggleCode(
  code: string
): Promise<result<string, string>> {
  try {
    const changedCode = makeAutomaticChanges(code);
    const formatted = await prettier.format(changedCode, {
      parser: "squiggle",
      plugins: [prettierSquigglePlugin],
    });
    return { ok: true, value: formatted };
  } catch (error) {
    return {
      ok: false,
      value: `Error formatting Squiggle code: ${error instanceof Error ? error.message : error}`,
    };
  }
}
