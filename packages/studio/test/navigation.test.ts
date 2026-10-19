// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from "vitest";

import {
  clearViewState,
  getHistoryFlags,
  getViewState,
  goBack,
  goForward,
  installNavigation,
  onHistoryRestore,
  recordNavigation,
  renameInHistory,
  resetNavigationForTests,
  updateViewState,
} from "../src/client/lib/navigation.js";
import type { ViewState } from "../src/shared/viewState.js";

// jsdom traverses history asynchronously and fires popstate.
function nextPopState(): Promise<void> {
  return new Promise((resolve) =>
    window.addEventListener("popstate", () => resolve(), { once: true })
  );
}

async function back() {
  const popped = nextPopState();
  goBack();
  await popped;
}

async function forward() {
  const popped = nextPopState();
  goForward();
  await popped;
}

const search = () => new URLSearchParams(window.location.search);

let historyLength0: number;

beforeEach(() => {
  resetNavigationForTests();
  window.history.replaceState(null, "", "/?test=1");
  historyLength0 = window.history.length;
  installNavigation();
});

describe("navigation history (§2.4)", () => {
  test("the first file replaces the start entry; each further file pushes", () => {
    recordNavigation({ file: "a.squiggle" }, "tree");
    expect(window.history.length).toBe(historyLength0);
    expect(getHistoryFlags()).toEqual({
      canGoBack: false,
      canGoForward: false,
    });
    recordNavigation({ file: "b.squiggle" }, "tree");
    recordNavigation({ file: "c.squiggle", view: "output" }, "quick-open");
    expect(window.history.length).toBe(historyLength0 + 2);
    expect(getHistoryFlags()).toEqual({ canGoBack: true, canGoForward: false });
    // The address bar encodes the current view and keeps the URL flags.
    expect(search().get("file")).toBe("c.squiggle");
    expect(search().get("view")).toBe("output");
    expect(search().get("test")).toBe("1");
    expect(window.history.state).toMatchObject({
      studio: 1,
      idx: 2,
      file: "c.squiggle",
    });
  });

  test("Back and Forward restore without recording", async () => {
    const restored: ViewState[] = [];
    onHistoryRestore((s) => restored.push(s));
    recordNavigation({ file: "a.squiggle" }, "tree");
    recordNavigation({ file: "b.squiggle" }, "tree");
    recordNavigation({ file: "c.squiggle" }, "tree");
    await back();
    await back();
    expect(restored.map((s) => s.file)).toEqual(["b.squiggle", "a.squiggle"]);
    expect(getViewState().file).toBe("a.squiggle");
    expect(getHistoryFlags()).toEqual({ canGoBack: false, canGoForward: true });
    // The workspace shows the restored file with reason "history": no entry.
    const length = window.history.length;
    recordNavigation({ file: "a.squiggle" }, "history");
    expect(window.history.length).toBe(length);
    await forward();
    expect(getViewState().file).toBe("b.squiggle");
    expect(getHistoryFlags()).toEqual({ canGoBack: true, canGoForward: true });
  });

  test("pushing after Back drops the forward entries", async () => {
    recordNavigation({ file: "a.squiggle" }, "tree");
    recordNavigation({ file: "b.squiggle" }, "tree");
    await back();
    recordNavigation({ file: "d.squiggle" }, "tree");
    expect(getHistoryFlags()).toEqual({ canGoBack: true, canGoForward: false });
  });

  test("Explorer arrow-key opens coalesce into one entry", async () => {
    recordNavigation({ file: "a.squiggle" }, "tree");
    const before = window.history.length;
    recordNavigation({ file: "b.squiggle" }, "tree-arrow");
    recordNavigation({ file: "c.squiggle" }, "tree-arrow");
    recordNavigation({ file: "d.squiggle" }, "tree-arrow");
    expect(window.history.length).toBe(before + 1);
    expect(getViewState().file).toBe("d.squiggle");
    await back();
    // Back returns to where the arrowing started.
    expect(getViewState().file).toBe("a.squiggle");
  });

  test("a non-arrow open after arrowing pushes again", () => {
    recordNavigation({ file: "a.squiggle" }, "tree");
    recordNavigation({ file: "b.squiggle" }, "tree-arrow");
    const before = window.history.length;
    recordNavigation({ file: "x.squiggle" }, "quick-open");
    recordNavigation({ file: "y.squiggle" }, "tree-arrow");
    expect(window.history.length).toBe(before + 2);
  });

  test("a view change of the shown file is a navigation; in-file state is not", async () => {
    recordNavigation({ file: "a.squiggle" }, "tree");
    // The view becomes known: not a navigation.
    updateViewState({ view: "output" });
    const before = window.history.length;
    updateViewState({ layout: "list", code: false });
    expect(window.history.length).toBe(before);
    expect(search().get("layout")).toBe("list");
    expect(search().get("code")).toBe("0");
    recordNavigation({ file: "a.squiggle", view: "relative-values" }, "api");
    expect(window.history.length).toBe(before + 1);
    updateViewState({ tab: "grid" });
    expect(search().get("tab")).toBe("grid");
    await back();
    expect(getViewState()).toEqual({
      file: "a.squiggle",
      view: "output",
      layout: "list",
      code: false,
    });
  });

  test("re-opening the shown file records nothing", () => {
    recordNavigation({ file: "a.squiggle", view: "output" }, "tree");
    const before = window.history.length;
    recordNavigation({ file: "a.squiggle" }, "tree");
    recordNavigation({ file: "a.squiggle", view: "output" }, "tree");
    expect(window.history.length).toBe(before);
  });

  test("a rename of the shown file rewrites the current entry", () => {
    recordNavigation({ file: "a.squiggle", view: "split" }, "tree");
    renameInHistory("a.squiggle", "b.squiggle");
    expect(getViewState()).toEqual({ file: "b.squiggle", view: "split" });
    expect(search().get("file")).toBe("b.squiggle");
  });

  test("the start page clears the view parameters", () => {
    recordNavigation({ file: "a.squiggle" }, "tree");
    clearViewState();
    expect(search().get("file")).toBeNull();
    expect(search().get("test")).toBe("1");
  });

  test("Studio's Back never leaves Studio", () => {
    recordNavigation({ file: "a.squiggle" }, "tree");
    expect(getHistoryFlags().canGoBack).toBe(false);
    const href = window.location.href;
    goBack(); // a no-op at the first entry
    expect(window.location.href).toBe(href);
  });

  test("after a reload, the entry's index is read back", () => {
    recordNavigation({ file: "a.squiggle" }, "tree");
    recordNavigation({ file: "b.squiggle" }, "tree");
    resetNavigationForTests();
    installNavigation();
    expect(getViewState().file).toBe("b.squiggle");
    expect(getHistoryFlags().canGoBack).toBe(true);
  });
});
