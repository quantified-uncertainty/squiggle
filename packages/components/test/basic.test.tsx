import { render } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";
import { SquiggleChart } from "../src/index";

test("Logs nothing on render", async () => {
  const { unmount } = render(<SquiggleChart code={"normal(0, 1)"} />);
  unmount();

  expect(console.log).not.toBeCalled();
  expect(console.warn).not.toBeCalled();
  expect(console.error).not.toBeCalled();
});
