import * as React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SquiggleChart } from "../src/index";

test("showSummary prop shows table", async () => {
  const { container } = render(
    <SquiggleChart
      code={"normal(5, 1)"}
      distributionChartSettings={{ showSummary: true }}
    />
  );
  expect(container).toHaveTextContent("Mean");
  expect(container).toHaveTextContent("5");
});
