import "@testing-library/jest-dom";

import {
  act,
  getByText,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { makeSelfContainedLinker } from "@quri/squiggle-lang";

import { SquigglePlayground } from "../src/index.js";

test("Playground renders", async () => {
  act(() =>
    // we have to use runner="embedded" because the default runner is web-worker;
    // TODO - try https://github.com/developit/jsdom-worker
    render(<SquigglePlayground defaultCode="2 to 3" runner="embedded" />)
  );
  await waitFor(() => screen.getByText(/simulation/));

  expect(screen.getByText(/simulation/)).toHaveTextContent(
    /simulation #(\d+) in (\d+)ms/
  );
  expect(screen.getByTestId("multi-distribution-chart")).toHaveTextContent(
    "Distribution plot"
  );
});

test("Stacktrace lines are clickable", async () => {
  act(() =>
    render(<SquigglePlayground defaultCode="2 to a" runner="embedded" />)
  );
  await waitFor(() => screen.getByText(/simulation/));

  const errorHeader = screen.getByText("Compile Error");
  expect(errorHeader).toBeDefined();

  expect(getByText(errorHeader.parentElement!, /column /)).toBeDefined();
  expect(getByText(errorHeader.parentElement!, /column /).tagName).toBe("A");
});

test("Stacktrace lines for imports are clickable", async () => {
  const linker = makeSelfContainedLinker({
    source1: `export x = 1 + // syntax error`,
  });

  const code = `
import "source1" as s1
x = 1
`;

  act(() =>
    render(
      <SquigglePlayground
        defaultCode={code}
        linker={linker}
        runner="embedded"
      />
    )
  );
  await waitFor(() => screen.getByText(/simulation/));

  const importChainHeader = screen.getByText("Import Chain:");
  expect(importChainHeader).toBeDefined();

  expect(getByText(importChainHeader.parentElement!, /column /)).toBeDefined();
  expect(getByText(importChainHeader.parentElement!, /column /).tagName).toBe(
    "A"
  );
});

test("Stacktrace lines for errors in imports are not clickable", async () => {
  const linker = makeSelfContainedLinker({
    source1: `export f() = 1 + ""`,
  });

  const code = `
import "source1" as s1
x = s1.f()
`;

  act(() =>
    render(
      <SquigglePlayground
        defaultCode={code}
        linker={linker}
        runner="embedded"
      />
    )
  );
  await waitFor(() => screen.getByText(/simulation/));

  const errorHeader = screen.getByText("Compile Error"); // compilation error in import
  expect(errorHeader).toBeDefined();

  // error in main code - clickable
  expect(getByText(errorHeader.parentElement!, /column 8/)).toBeDefined();
  expect(getByText(errorHeader.parentElement!, /column 8/).tagName).toBe("A");

  // error in import - not clickable
  expect(getByText(errorHeader.parentElement!, /column 14/)).toBeDefined();
  expect(getByText(errorHeader.parentElement!, /column 14/).tagName).not.toBe(
    "A"
  );
});
