import { format } from "./helpers.js";

describe("expressions", () => {
  test("basic", async () => {
    expect(await format("2+2")).toBe("2 + 2");
  });

  test("nested", async () => {
    expect(await format("2+3*4")).toBe("2 + 3 * 4");
    expect(await format("(2+3)*4")).toBe("(2 + 3) * 4");
    expect(await format("2/3/4")).toBe("2 / 3 / 4");
    expect(await format("2/(3/4)")).toBe("2 / (3 / 4)");
  });

  test("complicated", async () => {
    expect(
      await format(`
    4 > (3 > 2 ? 3 : 5) && 2 == -(-1 + -3 -> {|x|x / 3}) ? "ok" : "not ok"
`)
    ).toBe(
      '4 > (3 > 2 ? 3 : 5) && 2 == -(-1 + -3 -> {|x|x / 3}) ? "ok" : "not ok"'
    );
  });

  test("line breaks", async () => {
    expect(
      await format(`
    x = aweruihaweiruhaweilurhawuelirhawelriwaherilaw + auweryalweuirayiewurhawielrahwerilawherwearawer
`)
    ).toBe(
      `x = aweruihaweiruhaweilurhawuelirhawelriwaherilaw +
  auweryalweuirayiewurhawielrahwerilawherwearawer
`
    );
  });
});
