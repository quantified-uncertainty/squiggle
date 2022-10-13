import { render } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";
import { SquiggleChart } from "../src/index";

test("showSummary prop shows table", async () => {
  const { container } = render(
    <SquiggleChart code={"normal(5, 1)"} showSummary={true} />
  );
  expect(container).toHaveTextContent("Mean");
  expect(container).toHaveTextContent("5");
});
