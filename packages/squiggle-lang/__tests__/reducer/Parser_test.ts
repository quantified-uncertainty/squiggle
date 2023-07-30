import * as fc from "fast-check";

import { testRun } from "../helpers/helpers.js";
import "../helpers/toEqualSqValue.js";

describe("Squiggle's parser is whitespace insensitive", () => {
  test("when assigning a distribution to a name and calling that name", async () => {
    // intersperse varying amounts of whitespace in a squiggle string
    const squiggleString = (
      a: string,
      b: string,
      c: string,
      d: string,
      e: string,
      f: string,
      g: string,
      h: string
    ): string => {
      return `theDist${a}=${b}beta(${c}4${d},${e}5e1)${f};${g}theDist${h}`;
    };
    const squiggleOutput = await testRun(
      squiggleString("", "", "", "", "", "", "", "")
    );

    // Add "\n" to this when multiline is introduced.
    const whitespaceGen = () => {
      return fc.constantFrom("", " ", "\t", "  ", "   ", "    ", "     ");
    };

    fc.assert(
      fc.asyncProperty(
        whitespaceGen(),
        whitespaceGen(),
        whitespaceGen(),
        whitespaceGen(),
        whitespaceGen(),
        whitespaceGen(),
        whitespaceGen(),
        whitespaceGen(),
        async (a, b, c, d, e, f, g, h) => {
          expect(
            await testRun(squiggleString(a, b, c, d, e, f, g, h))
          ).toEqualSqValue(squiggleOutput);
        }
      )
    );
  });
});
