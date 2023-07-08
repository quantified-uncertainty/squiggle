import { format } from "./helpers.js";

describe("ternary", () => {
  test("C-style", async () => {
    expect(await format("x = 3 > 4 ? 5 : 6")).toBe("x = 3 > 4 ? 5 : 6\n");
  });

  test("if-then-else", async () => {
    expect(await format("x = if 3 > 4 then 5 else 6")).toBe(
      "x = if 3 > 4 then 5 else 6\n"
    );
  });
});
