import { testRun } from "../helpers/helpers";
import * as fc from "fast-check";

describe("Squiggle's parser is whitespace insensitive", () => {
  test("when assigning a distribution to a name and calling that name", () => {
    // intersperse varying amounts of whitespace in a squiggle string
    let squiggleString = (
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
    let squiggleOutput = testRun(
      squiggleString("", "", "", "", "", "", "", "")
    );

    // Add "\n" to this when multiline is introduced.
    let whitespaceGen = () => {
      return fc.constantFrom("", " ", "\t", "  ", "   ", "    ", "     ");
    };

    fc.assert(
      fc.property(
        whitespaceGen(),
        whitespaceGen(),
        whitespaceGen(),
        whitespaceGen(),
        whitespaceGen(),
        whitespaceGen(),
        whitespaceGen(),
        whitespaceGen(),
        (a, b, c, d, e, f, g, h) => {
          expect(
            testRun(squiggleString(a, b, c, d, e, f, g, h))
          ).toEqualSqValue(squiggleOutput);
        }
      )
    );
  });
});
