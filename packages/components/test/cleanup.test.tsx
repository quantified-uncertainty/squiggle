import "@testing-library/jest-dom";
import { render, waitFor } from "@testing-library/react";

import { SqProject } from "@quri/squiggle-lang";

import { SquiggleChart } from "../src/index.js";

test("Creates and cleans up source", async () => {
  const project = SqProject.create();

  const { unmount } = render(
    <SquiggleChart code={"normal(0, 1)"} project={project} />
  );

  await waitFor(() => {
    expect(project.getSourceIds().length).toBe(1);
  });

  const sourceId = project.getSourceIds()[0];
  expect(project.getSource(sourceId)).toBe("normal(0, 1)");

  unmount();
  expect(project.getSourceIds().length).toBe(0);
  expect(project.getSource(sourceId)).toBe(undefined);
});
