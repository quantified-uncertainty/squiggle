import * as prettier from "prettier";

export async function format(code: string) {
  return await prettier.format(code, {
    parser: "squiggle",
    plugins: ["./src/index.ts"],
  });
}
