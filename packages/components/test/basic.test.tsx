import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";
import {
  SquiggleChart,
  SquiggleEditor,
  SquigglePlayground,
} from "../src/index";
import { SqProject } from "@quri/squiggle-lang";

test("Chart logs nothing on render", async () => {
  const { unmount } = render(<SquiggleChart code={"normal(0, 1)"} />);
  unmount();

  /* eslint-disable no-console */
  expect(console.log).not.toBeCalled();
  expect(console.warn).not.toBeCalled();
  expect(console.error).not.toBeCalled();
  /* eslint-enable no-console */
});

test("Editor logs nothing on render", async () => {
  const { unmount } = render(<SquiggleEditor code={"normal(0, 1)"} />);
  unmount();

  /* eslint-disable no-console */
  expect(console.log).not.toBeCalled();
  expect(console.warn).not.toBeCalled();
  expect(console.error).not.toBeCalled();
  /* eslint-enable no-console */
});

test("Project dependencies work in editors", async () => {
  const project = SqProject.create();

  render(<SquiggleEditor code={"x = 1"} project={project} />);
  const source = project.getSourceIds()[0];
  const { container } = render(
    <SquiggleEditor code={"x + 1"} project={project} continues={[source]} />
  );
  expect(container).toHaveTextContent("2");
});

test("Project dependencies work in playgrounds", async () => {
  const project = SqProject.create();
  project.setSource("depend", "x = 1");

  render(
    <SquigglePlayground
      code={"x + 1"}
      project={project}
      continues={["depend"]}
    />
  );
  // We must await here because SquigglePlayground loads results asynchronously
  await waitFor(() =>
    expect(screen.getByTestId("playground-result")).toHaveTextContent("2")
  );
});
