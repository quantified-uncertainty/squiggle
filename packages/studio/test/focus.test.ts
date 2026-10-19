// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import {
  getContext,
  resetContextForTests,
} from "../src/client/commands/context.js";
import {
  focusMain,
  focusNextPart,
  focusRegion,
  getFocusRegion,
  installFocusTracking,
  isRegionAvailable,
  registerFocuser,
  resetFocusForTests,
  useOverlay,
} from "../src/client/commands/focus.js";

let stop: () => void;

function region(name: string, inner: string, tag = "div"): HTMLElement {
  const el = document.createElement(tag);
  el.setAttribute("data-studio-region", name);
  el.innerHTML = inner;
  document.body.appendChild(el);
  return el;
}

function buildShell() {
  const tree = region("tree", "", "aside");
  tree.tabIndex = 0;
  const editor = region("editor", `<textarea id="code"></textarea>`);
  const view = region("view", `<button id="card">card</button>`);
  const status = region(
    "statusbar",
    `<button id="live">Live</button>`,
    "footer"
  );
  return { tree, editor, view, status };
}

beforeEach(() => {
  document.body.innerHTML = "";
  resetContextForTests();
  resetFocusForTests();
  stop = installFocusTracking();
});

afterEach(() => stop());

const active = () => document.activeElement;

describe("F6 cycle", () => {
  test("tree → editor → view → statusbar → tree", async () => {
    const { tree } = buildShell();
    tree.focus();
    expect(getFocusRegion()).toBe("tree");
    await focusNextPart(1);
    expect(active()?.id).toBe("code");
    expect(getFocusRegion()).toBe("editor");
    await focusNextPart(1);
    expect(active()?.id).toBe("card");
    await focusNextPart(1);
    expect(active()?.id).toBe("live");
    await focusNextPart(1);
    expect(active()).toBe(tree);
  });

  test("⇧F6 goes backwards and wraps", async () => {
    const { tree } = buildShell();
    tree.focus();
    await focusNextPart(-1);
    expect(getFocusRegion()).toBe("statusbar");
    await focusNextPart(-1);
    expect(getFocusRegion()).toBe("view");
  });

  test("absent and hidden regions are skipped", async () => {
    const { tree, editor, status } = buildShell();
    editor.remove(); // a text file without a code editor region
    status.hidden = true; // View ▸ Status Bar off, kept in the DOM
    expect(isRegionAvailable("editor")).toBe(false);
    expect(isRegionAvailable("statusbar")).toBe(false);
    tree.focus();
    await focusNextPart(1);
    expect(getFocusRegion()).toBe("view");
    await focusNextPart(1);
    expect(getFocusRegion()).toBe("tree");
  });

  test("a region marked data-region-hidden is skipped", async () => {
    const { tree, editor } = buildShell();
    editor.setAttribute("data-region-hidden", "true"); // collapsed code pane
    tree.focus();
    await focusNextPart(1);
    expect(getFocusRegion()).toBe("view");
  });

  test("with focus outside every region, F6 starts at the first one", async () => {
    buildShell();
    await focusNextPart(1);
    expect(getFocusRegion()).toBe("tree");
  });
});

describe("focusRegion", () => {
  test("uses the registered focuser", async () => {
    buildShell();
    const off = registerFocuser("view", () => {
      document.getElementById("card")?.focus();
      return true;
    });
    expect(await focusRegion("view")).toBe(true);
    expect(active()?.id).toBe("card");
    off();
  });

  test("retries until the region mounts (file switches remount it)", async () => {
    const pending = focusRegion("editor", { retryMs: 300 });
    setTimeout(() => region("editor", `<textarea id="later"></textarea>`), 50);
    expect(await pending).toBe(true);
    expect(active()?.id).toBe("later");
  });

  test("gives up after retryMs", async () => {
    const start = Date.now();
    expect(await focusRegion("editor", { retryMs: 60 })).toBe(false);
    expect(Date.now() - start).toBeGreaterThanOrEqual(50);
  });

  test("a focuser returning false is retried", async () => {
    buildShell();
    let ready = false;
    registerFocuser("editor", () => {
      if (!ready) return false;
      document.getElementById("code")?.focus();
      return true;
    });
    setTimeout(() => (ready = true), 40);
    expect(await focusRegion("editor", { retryMs: 300 })).toBe(true);
    expect(active()?.id).toBe("code");
  });

  test("focusMain prefers the last main region", async () => {
    buildShell();
    (document.getElementById("card") as HTMLElement).focus();
    (document.querySelector("aside") as HTMLElement).focus();
    expect(await focusMain()).toBe(true);
    expect(getFocusRegion()).toBe("view");
  });
});

describe("context keys", () => {
  test("text inputs, CodeMirror and the Explorer", () => {
    const { tree } = buildShell();
    tree.focus();
    expect(getContext()["focusRegion"]).toBe("tree");
    expect(getContext()["filesExplorerFocus"]).toBe(true);

    const input = document.createElement("input");
    tree.appendChild(input);
    input.focus();
    expect(getContext()["textInputFocus"]).toBe(true);
    expect(getContext()["filesExplorerFocus"]).toBe(false);

    const cm = region(
      "editor",
      `<div class="cm-editor"><div class="cm-content" contenteditable="true" tabindex="0" id="cm"></div></div>`
    );
    (cm.querySelector("#cm") as HTMLElement).focus();
    expect(getContext()["editorTextFocus"]).toBe(true);
    // CodeMirror's contenteditable is not a "text input".
    expect(getContext()["textInputFocus"]).toBe(false);
  });

  test("useOverlay counts open overlays", async () => {
    const { act, createElement } = await import("react");
    const { createRoot } = await import("react-dom/client");
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    const Overlay = ({ open }: { open: boolean }) => {
      useOverlay(open);
      return null;
    };
    const root = createRoot(document.createElement("div"));
    act(() => root.render(createElement(Overlay, { open: true })));
    expect(getContext()["overlayOpen"]).toBe(true);
    act(() => root.render(createElement(Overlay, { open: false })));
    expect(getContext()["overlayOpen"]).toBe(false);
    act(() => root.unmount());
  });
});
