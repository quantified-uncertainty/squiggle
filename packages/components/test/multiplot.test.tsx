import { render, screen } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";
import { SquiggleChart } from "../src/index";

test("Plot.dists render a figure", async () => {
  render(
    <SquiggleChart
      code={`Plot.dists({dists: [{name: "dist1", value: 1 to 12}, {name: "dist2", value: normal(5, 2)}]})`}
    />
  );
  let chart = await screen.findByRole("figure");
  expect(chart).toBeInTheDocument();
});
