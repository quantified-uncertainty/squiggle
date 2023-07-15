import { format } from "./helpers.js";

describe("annotations", () => {
  test("lambda with annotations", async () => {
    expect(await format("f={|x:[3,5],y|x*y}")).toBe(
      "f = {|x: [3, 5], y|x * y}\n"
    );
  });
});
