import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";

import { SquiggleChart } from "../src/index.js";

test("Plot.dists render a figure", async () => {
  render(
    <SquiggleChart
      code={`Plot.dists({dists: [{name: "dist1", value: 1 to 12}, {name: "dist2", value: normal(5, 2)}]})`}
    />
  );
  await waitFor(() => {
    const chart = screen.getByTestId("multi-distribution-chart");
    expect(chart).toBeInTheDocument();
  });
});
