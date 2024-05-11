import "@testing-library/jest-dom";

import {
  act,
  getByText,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { SquiggleEditor } from "../src/index.js";

test("Viewer renders", async () => {
  act(() => render(<SquiggleEditor defaultCode="2 to 3" />));
  await waitFor(() => screen.getByText(/simulation/));

  expect(screen.getByText(/simulation/)).toHaveTextContent(
    /simulation #(\d+) in (\d+)ms/
  );
  expect(screen.getByTestId("multi-distribution-chart")).toHaveTextContent(
    "Distribution plot"
  );
});

test("Stacktrace links are clickable", async () => {
  act(() => render(<SquiggleEditor defaultCode="2 to a" />));
  await waitFor(() => screen.getByText(/simulation/));

  const errorHeader = screen.getByText("Compile Error");
  expect(errorHeader).toBeDefined();

  expect(getByText(errorHeader.parentElement!, /column /)).toBeDefined();
});
