import { format } from "./helpers.js";

describe("pipes", () => {
  test("simple", async () => {
    expect(await format("5->pointMass")).toBe("5 -> pointMass");
  });

  test("with args", async () => {
    expect(await format("5->add(6)")).toBe("5 -> add(6)");
  });

  test("complex", async () => {
    expect(
      await format(
        "pipe = 5 -> f1 -> f2() -> f3(1) -> {f: f2}.f2 -> {foo: f3}.foo(1)"
      )
    ).toBe(
      "pipe = 5 -> f1 -> f2 -> f3(1) -> { f: f2 }.f2 -> { foo: f3 }.foo(1)\n"
    );
  });
});
