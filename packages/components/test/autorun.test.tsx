import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import "@testing-library/jest-dom";
import { SquigglePlayground } from "../src/index";

test("Autorun is default", async () => {
  render(<SquigglePlayground code="70*30" />);
  await waitFor(() =>
    expect(screen.getByTestId("playground-result")).toHaveTextContent("2100")
  );
});

test("Autorun can be switched off", async () => {
  const user = userEvent.setup();
  render(<SquigglePlayground code="70*30" />);

  expect(screen.getByTestId("autorun-controls")).toHaveTextContent("Autorun");

  await waitFor(() =>
    expect(screen.getByTestId("playground-result")).toHaveTextContent("2100")
  );

  await user.click(screen.getByText("Autorun")); // disable
  expect(screen.getByTestId("autorun-controls")).toHaveTextContent("Paused");
  expect(screen.getByTestId("autorun-controls")).not.toHaveTextContent(
    "Autorun"
  );

  await user.click(screen.getByText("Paused")); // enable autorun again
  expect(screen.getByTestId("autorun-controls")).toHaveTextContent("Autorun");

  // we should replace the code here, but it's hard to update react-ace state via user events: https://github.com/securingsincity/react-ace/issues/923
  // ...or replace react-ace with something else

  // TODO:

  /*
  const editor = screen
    .getByTestId("squiggle-editor")
    .querySelector(".ace_editor") as HTMLElement;
  editor.focus();
  //   await user.clear(editor);
  await userEvent.paste("40*40"); // https://github.com/securingsincity/react-ace/issues/923#issuecomment-755502696
  screen.debug(editor);

  // this makes the tests slower, but it's hard to test otherwise that the code _didn't_ execute
  await new Promise((r) => setTimeout(r, 300));
  expect(screen.getByTestId("playground-result")).toHaveTextContent("2100"); // still the old value

  await waitFor(() =>
    expect(screen.getByTestId("playground-result")).toHaveTextContent("1600")
  );
*/
});
