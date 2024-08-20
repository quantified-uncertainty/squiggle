import * as prettier from "prettier/standalone";

import * as prettierSquigglePlugin from "@quri/prettier-plugin-squiggle/standalone";
import { result } from "@quri/squiggle-lang";

//This is moved in its own file, because the prettier plugin causes issues with the tests.
export const formatSquiggleCode = async (
  code: string
): Promise<result<string, string>> => {
  try {
    const formatted = await prettier.format(code, {
      parser: "squiggle",
      plugins: [prettierSquigglePlugin],
    });
    return { ok: true, value: formatted };
  } catch (error) {
    return {
      ok: false,
      value: `Error formatting Squiggle code: ${error.message}`,
    };
  }
};
