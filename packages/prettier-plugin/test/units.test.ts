import { format } from "./helpers.js";

describe("units", () => {
  test("known", async () => {
    expect(await format("x = 15k")).toBe("x = 15k\n");
  });
});
