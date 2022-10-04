import { render } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";
import { SquiggleChart } from "../src/index";
import { SqProject } from "@quri/squiggle-lang";

test("Creates and cleans up source with no name", async () => {
  const project = SqProject.create();

  const { unmount } = render(
    <SquiggleChart code={"normal(0, 1)"} project={project} />
  );
  expect(project.getSourceIds().length).toBe(1);

  const sourceId = project.getSourceIds()[0];
  expect(project.getSource(sourceId)).toBe("normal(0, 1)");

  unmount();
  expect(project.getSourceIds().length).toBe(0);
  expect(project.getSource(sourceId)).toBe(undefined);
});

test("Does not clean up existing source", async () => {
  const project = SqProject.create();

  project.setSource("main", "normal(0, 1)");

  const { unmount } = render(
    <SquiggleChart sourceName={"main"} project={project} />
  );

  expect(project.getSourceIds()).toStrictEqual(["main"]);

  const sourceId = project.getSourceIds()[0];
  expect(project.getSource(sourceId)).toBe("normal(0, 1)");

  unmount();
  expect(project.getSourceIds()).toStrictEqual(["main"]);
  expect(project.getSource(sourceId)).toBe("normal(0, 1)");
});

test("Does clean up when given non-existant source", async () => {
  const project = SqProject.create();

  const { unmount } = render(
    <SquiggleChart
      code={"normal(0, 1)"}
      sourceName={"main"}
      project={project}
    />
  );

  expect(project.getSourceIds()).toStrictEqual(["main"]);

  const sourceId = project.getSourceIds()[0];
  expect(project.getSource(sourceId)).toBe("normal(0, 1)");

  unmount();
  expect(project.getSourceIds()).toStrictEqual([]);
  expect(project.getSource(sourceId)).toBe(undefined);
});
