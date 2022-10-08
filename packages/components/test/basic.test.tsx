import { render, screen } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";
import { SquiggleChart, SquiggleEditor } from "../src/index";
import { SqProject } from "@quri/squiggle-lang";

test("Chart logs nothing on render", async () => {
  const { unmount } = render(<SquiggleChart code={"normal(0, 1)"} />);
  unmount();

  expect(console.log).not.toBeCalled();
  expect(console.warn).not.toBeCalled();
  expect(console.error).not.toBeCalled();
});

test("Editor logs nothing on render", async () => {
  const { unmount } = render(<SquiggleEditor code={"normal(0, 1)"} />);
  unmount();

  expect(console.log).not.toBeCalled();
  expect(console.warn).not.toBeCalled();
  expect(console.error).not.toBeCalled();
});

test("Project dependencies work in editors", async () => {
  const project = SqProject.create();

  render(<SquiggleEditor code={"x = 1"} project={project} />);
  const source = project.getSourceIds()[0];
  render(
    <SquiggleEditor code={"x + 1"} project={project} continues={[source]} />
  );
  screen.getByText("2");
});
