import { format } from "./helpers.js";

// In general, this behavior matches prettier for JS.
describe("numbers", () => {
  test("integer", async () => {
    expect(await format("123")).toBe("123");
  });

  test("negative integer", async () => {
    expect(await format("-123")).toBe("-123");
  });

  test("fixed point", async () => {
    expect(await format("1.5")).toBe("1.5");
  });

  test("fixed point with trailing zero", async () => {
    expect(await format("1.0")).toBe("1.0");
  });

  test("fixed point with multiple trailing zeroes", async () => {
    expect(await format("1.000")).toBe("1.0");
  });

  test("fixed point without fractional part", async () => {
    expect(await format("1.")).toBe("1");
  });

  test("floating point with fake fractional part", async () => {
    expect(await format("1.e3")).toBe("1e3");
  });
  test("floating point with single zero fractional part", async () => {
    expect(await format("1.0e3")).toBe("1.0e3");
  });
  test("floating point with multiple zeroes as fractional part", async () => {
    expect(await format("1.000e3")).toBe("1.0e3");
  });

  test("floating point with explicit plus sign for exponent", async () => {
    expect(await format("1e+3")).toBe("1e3");
  });
  test("floating point with negative exponent", async () => {
    expect(await format("1e-3")).toBe("1e-3");
  });
});
