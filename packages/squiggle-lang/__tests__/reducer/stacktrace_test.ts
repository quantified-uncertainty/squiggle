import { evaluateStringToResult } from "../../src/reducer/index.js";

describe("stacktraces", () => {
  test("nested calls", async () => {
    const result = await evaluateStringToResult(`
  f(x) = {
    y = "a"
    x + y
  }
  g = {|x| f(x)}
  h(x) = g(x)
  h(5)
`);
    if (result.ok) {
      throw new Error("Expected code to fail");
    }
    const error = result.value.toStringWithDetails();

    expect(error).toBe(
      `Error: There are function matches for add(), but with different arguments:
  add(Date, Duration) => Date
  add(Duration, Date) => Date
  add(Duration, Duration) => Duration
  add(Number, Number) => Number
  add(Dist, Number) => Dist
  add(Number, Dist) => Dist
  add(Dist, Dist) => Dist
  add(String, String) => String
  add(String, any) => String
Was given arguments: (5,"a")
Stack trace:
  add
  f at line 4, column 5, file main
  g at line 6, column 12, file main
  h at line 7, column 10, file main
  <top> at line 8, column 3, file main`
    );
  });
});
