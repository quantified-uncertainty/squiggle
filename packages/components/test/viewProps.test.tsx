import "@testing-library/jest-dom";

import { render, waitFor } from "@testing-library/react";
import * as React from "react";

import { SquiggleChart } from "../src/index.js";

test("showSummary prop shows table", async () => {
  const { container } = render(<SquiggleChart code={"normal(5, 1)"} />);
  await waitFor(() => {
    expect(container).toHaveTextContent("Mean");
    expect(container).toHaveTextContent("5");
  });
});
