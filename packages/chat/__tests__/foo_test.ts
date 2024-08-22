import { runSquiggle } from "../src/llmScript/getSquiggleDocs";

describe("errors", () => {
  let runResult;

  beforeAll(async () => {
    runResult = await runSquiggle("foo = 34 to 50");
    console.log("HI", runResult);
  });

  test("REOther", () => {
    expect("hello").toEqual("hello");
  });
});
