import { render } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";
import { SquiggleChart } from "../src/index";

test("Precision", async () => {
  const { container: highPrecision } = render(
    <SquiggleChart code={"1.25476"} numberPrecision={5} />
  );
  expect(highPrecision).toHaveTextContent("1.2548");

  const { container: lowPrecision } = render(
    <SquiggleChart code={"1.25476"} numberPrecision={2} />
  );
  expect(lowPrecision).toHaveTextContent("1.3");
});
