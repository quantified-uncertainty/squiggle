import { render } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";
import { SquiggleChart } from "../src/index";
import { SqProject } from "@quri/squiggle-lang";

test("Creates and cleans up source", async () => {
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

test("Creates and cleans up source and imports", async () => {
  const project = SqProject.create();

  const { unmount } = render(
    <SquiggleChart
      code={"normal($x, 1)"}
      project={project}
      jsImports={{ x: 3 }}
    />
  );

  expect(project.getSourceIds().length).toBe(2);

  unmount();
  expect(project.getSourceIds()).toStrictEqual([]);
});
