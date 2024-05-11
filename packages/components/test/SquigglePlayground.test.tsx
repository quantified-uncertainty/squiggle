import "@testing-library/jest-dom";

import {
  act,
  getByText,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { SqLinker } from "@quri/squiggle-lang";

import { SquigglePlayground } from "../src/index.js";

test("Playground renders", async () => {
  act(() => render(<SquigglePlayground defaultCode="2 to 3" />));
  await waitFor(() => screen.getByText(/simulation/));

  expect(screen.getByText(/simulation/)).toHaveTextContent(
    /simulation #(\d+) in (\d+)ms/
  );
  expect(screen.getByTestId("multi-distribution-chart")).toHaveTextContent(
    "Distribution plot"
  );
});

test("Stacktrace lines are clickable", async () => {
  act(() => render(<SquigglePlayground defaultCode="2 to a" />));
  await waitFor(() => screen.getByText(/simulation/));

  const errorHeader = screen.getByText("Compile Error");
  expect(errorHeader).toBeDefined();

  expect(getByText(errorHeader.parentElement!, /column /)).toBeDefined();
  expect(getByText(errorHeader.parentElement!, /column /).tagName).toBe("A");
});

test("Stacktrace lines for imports are not clickable", async () => {
  const linker: SqLinker = {
    resolve: (name) => name,
    loadSource: async (sourceName) => {
      // Note how this function is async and can load sources remotely on demand.
      switch (sourceName) {
        case "source1":
          return `export x = 1 + // syntax error`;
        default:
          throw new Error(`source ${sourceName} not found`);
      }
    },
  };

  const code = `
import "source1" as s1
x = 1
`;

  act(() => render(<SquigglePlayground defaultCode={code} linker={linker} />));
  await waitFor(() => screen.getByText(/simulation/));

  const errorHeader = screen.getByText("Compile Error");
  expect(errorHeader).toBeDefined();

  expect(getByText(errorHeader.parentElement!, /column /)).toBeDefined();
  expect(getByText(errorHeader.parentElement!, /column /).tagName).not.toBe(
    "A"
  );
});
