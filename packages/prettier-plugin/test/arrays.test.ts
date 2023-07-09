import { format } from "./helpers.js";

describe("arrays", () => {
  test("empty", async () => {
    expect(await format("[]")).toBe("[]");
    expect(await format("[   ]")).toBe("[]");
  });

  test("single item", async () => {
    expect(await format("[ 1   ]")).toBe("[1]");
  });

  test("multiple", async () => {
    expect(await format("[ 1, 3, 5   ]")).toBe("[1, 3, 5]");
  });

  test("multi-line", async () => {
    expect(
      await format(
        "[111111,222222,333333,444444,555555,666666,777777,888888,999999,1000000]"
      )
    ).toBe(
      `[
  111111,
  222222,
  333333,
  444444,
  555555,
  666666,
  777777,
  888888,
  999999,
  1000000,
]`
    );
  });
});
