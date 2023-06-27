import "@testing-library/jest-dom";
import { render, waitFor } from "@testing-library/react";

import { SqProject } from "@quri/squiggle-lang";

import {
  SquiggleChart,
  SquiggleEditor,
  SquigglePlayground,
} from "../src/index.js";

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
  const { unmount } = render(<SquiggleEditor defaultCode="normal(0, 1)" />);
  unmount();

  /* eslint-disable no-console */
  expect(console.log).not.toBeCalled();
  expect(console.warn).not.toBeCalled();
  expect(console.error).not.toBeCalled();
  /* eslint-enable no-console */
});

test("Project dependencies work in editors", async () => {
  const project = SqProject.create();

  project.setSource("depend", "x = 123");

  const rendered = render(
    <SquiggleEditor
      defaultCode="x + 456"
      project={project}
      continues={["depend"]}
    />
  );

  await waitFor(() => expect(project.getSourceIds().length).toBe(2));

  await waitFor(() =>
    expect(rendered.getByTestId("dynamic-viewer-result")).toHaveTextContent(
      "579"
    )
  );
});

test("Playground", async () => {
  const rendered = render(<SquigglePlayground defaultCode="123 + 456" />);
  // We must await here because SquigglePlayground loads results asynchronously
  await waitFor(() =>
    expect(rendered.getByTestId("dynamic-viewer-result")).toHaveTextContent(
      "579"
    )
  );
});
