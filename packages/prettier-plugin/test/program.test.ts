import { format } from "./helpers.js";

describe("program", () => {
  test("new line after final statement", async () => {
    expect(
      await format(`x=1
    y=2`)
    ).toBe(`x = 1
y = 2
`);
  });

  test("no new line after final expression", async () => {
    expect(
      await format(`x=1
    x+1`)
    ).toBe(`x = 1
x + 1`);
  });

  test("keep new line", async () => {
    expect(
      await format(`x=1
    y = 2
    
    z = 3`)
    ).toBe(`x = 1
y = 2

z = 3
`);
  });

  test("keep no more than one new line", async () => {
    expect(
      await format(`x=1
    y = 2
    


    z = 3`)
    ).toBe(`x = 1
y = 2

z = 3
`);
  });
});
