import { SqProject } from "../../src/public/SqProject/index.js";
import {
  runFetchBindings,
  runFetchExports,
  runFetchResult,
} from "../helpers/projectHelpers.js";

// Basic tests - single head, no imports.
// Mostly just testing that the project runs and returns the expected results.

test("test result true", async () => {
  const project = new SqProject();
  project.setSimpleHead("main", "true");
  expect(await runFetchResult(project, "main")).toBe("Ok(true)");
});

test("test result false", async () => {
  const project = new SqProject();
  project.setSimpleHead("main", "false");
  expect(await runFetchResult(project, "main")).toBe("Ok(false)");
});

test("test library", async () => {
  const project = new SqProject();
  project.setSimpleHead("main", "x=Math.pi; x");
  expect(await runFetchResult(project, "main")).toBe("Ok(3.141592653589793)");
});

test("test bindings", async () => {
  const project = new SqProject();
  project.setSimpleHead("variables", "myVariable=666");
  expect(await runFetchBindings(project, "variables")).toBe(
    "{myVariable: 666}"
  );
});

test("test exports", async () => {
  const project = new SqProject();
  project.setSimpleHead("main", "x = 5; export y = 6; z = 7; export t = 8");
  expect(await runFetchExports(project, "main")).toBe(
    '{y: 6, with tags {exportData: {sourceId:"main",path:["y"]}}, t: 8, with tags {exportData: {sourceId:"main",path:["t"]}}}, with tags {name: "main", exportData: {sourceId:"main",path:[]}}'
  );
});

test("test decorated exports", async () => {
  const project = new SqProject();
  project.setSimpleHead(
    "main",
    `
    @name("X")
    export x = 5

    @name("Y")
    @doc("whatever")
    export y = 6
  `
  );
  expect(await runFetchExports(project, "main")).toBe(
    '{x: 5, with tags {name: "X", exportData: {sourceId:"main",path:["x"]}}, y: 6, with tags {name: "Y", doc: "whatever", exportData: {sourceId:"main",path:["y"]}}}, with tags {name: "main", exportData: {sourceId:"main",path:[]}}'
  );
});
