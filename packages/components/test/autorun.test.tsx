import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import { SquigglePlayground } from "../src/index.js";

test("Autorun is default", async () => {
  act(() => render(<SquigglePlayground defaultCode="70*30" />));
  await waitFor(() =>
    expect(screen.getByTestId("dynamic-viewer-result")).toHaveTextContent(
      "2100"
    )
  );
});

test("Autorun can be switched off", async () => {
  const user = userEvent.setup();
  act(() => render(<SquigglePlayground defaultCode="70*30" />));

  expect(screen.getByTestId("autorun-controls")).toHaveAttribute(
    "aria-checked",
    "true"
  );

  await waitFor(() =>
    expect(screen.getByTestId("dynamic-viewer-result")).toHaveTextContent(
      "2100"
    )
  );

  await act(async () => {
    await user.click(screen.getByTestId("autorun-controls").firstElementChild!); // disable
  });

  expect(screen.getByTestId("autorun-controls")).toHaveAttribute(
    "aria-checked",
    "false"
  );

  await act(
    async () => await user.click(screen.getByTestId("autorun-controls")) // enable autorun again
  );

  expect(screen.getByTestId("autorun-controls")).toHaveTextContent("Autorun");

  // we should replace the code here, by sending some kind of event to Codemirror

  // TODO:

  /*
  const editor = screen
    .getByTestId("squiggle-editor")
    .querySelector(".cm-editor") as HTMLElement;
  editor.focus();
  //   await user.clear(editor);
  await act(async () => await (userEvent as any).paste("40*40"));

  screen.debug(editor);

  // this makes the tests slower, but it's hard to test otherwise that the code _didn't_ execute
  await new Promise((r) => setTimeout(r, 300));
  expect(screen.getByTestId("playground-result")).toHaveTextContent("2100"); // still the old value

  await waitFor(() =>
    expect(screen.getByTestId("playground-result")).toHaveTextContent("1600")
  );
  */
});
