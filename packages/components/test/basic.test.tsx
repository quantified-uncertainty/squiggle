import "@testing-library/jest-dom";

import { render, waitFor } from "@testing-library/react";

import {
  SquiggleChart,
  SquiggleEditor,
  SquigglePlayground,
} from "../src/index.js";

test("Chart logs nothing on render", async () => {
  const { unmount } = render(<SquiggleChart code={"normal(0, 1)"} />);
  unmount();

  /* eslint-disable no-console */
  expect(console.log).not.toHaveBeenCalled();
  expect(console.warn).not.toHaveBeenCalled();
  expect(console.error).not.toHaveBeenCalled();
  /* eslint-enable no-console */
});

test("Editor logs nothing on render", async () => {
  const { unmount } = render(<SquiggleEditor defaultCode="normal(0, 1)" />);
  unmount();

  /* eslint-disable no-console */
  expect(console.log).not.toHaveBeenCalled();
  expect(console.warn).not.toHaveBeenCalled();
  expect(console.error).not.toHaveBeenCalled();
  /* eslint-enable no-console */
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
