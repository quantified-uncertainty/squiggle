import { defaultEnv } from "../../src/dists/env.js";
import { makeSelfContainedLinker, SqProject } from "../../src/index.js";

test("run with profile", async () => {
  const project = new SqProject({
    environment: {
      ...defaultEnv,
      profile: true,
    },
  });
  project.setSimpleHead("main", "f(x) = x; y = f(1) + f(2)");
  const { result } = await project.waitForOutput("main");

  if (!result.ok) throw "assert";
  const runs = result.value.profile?.runs;

  expect(runs).toEqual([
    2, // every point in a defun statement runs at least twice: once for Assign and once for Lambda
    2,
    2,
    2,
    2,
    2,
    2,
    4,
    0, // ";"
    0, // " "
    1,
    1,
    1,
    1,
    5,
    4,
    5,
    4,
    3,
    3,
    3,
    5,
    4,
    5,
    4,
    0,
  ]);
});

test("profile imported modules", async () => {
  const project = new SqProject({
    linker: makeSelfContainedLinker({
      second: "export x = 1",
    }),
    environment: {
      ...defaultEnv,
      profile: true,
    },
  });
  project.setSimpleHead(
    "main",
    `import 'second' as s
s.x`
  );
  const { result } = await project.waitForOutput("main");

  if (!result.ok) throw result.value;
  const runs = result.value.profile?.runs;

  expect(runs).toEqual([
    0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 4, 3, 3, 0,
  ]);
});
