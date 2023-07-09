import { format } from "./helpers.js";

describe("imports", () => {
  test("single import", async () => {
    expect(
      await format(`import     "./foo.squiggle" as foo
    123`)
    ).toBe(`import "./foo.squiggle" as foo
123`);
  });

  test("multiple imports", async () => {
    expect(
      await format(`import     "./foo.squiggle" as foo
import     "./foo2.squiggle" as foo2 // hello


import     "./foo3.squiggle" as foo3

    123`)
    ).toBe(`import "./foo.squiggle" as foo
import "./foo2.squiggle" as foo2
import "./foo3.squiggle" as foo3
// hello

123`);
  });
});
