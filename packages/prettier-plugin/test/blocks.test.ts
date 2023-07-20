import { format } from "./helpers.js";

describe("blocks", () => {
  test("single statement unwrapped", async () => {
    expect(
      await format(`x={1}
    `)
    ).toBe(`x = 1
`);
  });

  test("single statement unwrapped from many blocks", async () => {
    expect(
      await format(`x={{{1}}}
    `)
    ).toBe(`x = 1
`);
  });

  test("multi-line block", async () => {
    expect(await format(`x={y=1;y}`)).toBe(`x = {
  y = 1
  y
}
`);
  });

  test("keep new line", async () => {
    expect(
      await format(`x={
    y = 2
    
    z = 3
    y + z
       }`)
    ).toBe(`x = {
  y = 2

  z = 3
  y + z
}
`);
  });

  test("keep no more than one new line", async () => {
    expect(
      await format(`x={
    y = 2


    
    z = 3
    y + z
       }`)
    ).toBe(`x = {
  y = 2

  z = 3
  y + z
}
`);
  });
});
