/**
 * @jest-environment ./test/JSDOMEnvironment.ts
 */
import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { createRef, type FC } from "react";

import { run } from "@quri/squiggle-lang";

import {
  createRelativeValuesBundle,
  findRelativeValuesExports,
  InMemoryRelativeValuesCache,
  ModelEvaluator,
  RelativeValuesDashboard,
  type RelativeValuesDashboardProps,
  type RelativeValuesHandle,
  type RelativeValuesSpec,
} from "../src/index.js";

// The List view across live reloads (QA #28): the unit is an id resolved
// against the current definition, and so are the sidebar's items. Live
// reloads re-render the same dashboard with a new definition and evaluator,
// as Squiggle Studio does.

type Version = { spec: RelativeValuesSpec; evaluator: ModelEvaluator };

async function version(
  code: string,
  opts: { cache?: InMemoryRelativeValuesCache; bundled?: boolean } = {}
): Promise<Version> {
  const [found] = findRelativeValuesExports(await run(code));
  if (!found.spec.ok) throw new Error(found.spec.value);
  const evaluator = await ModelEvaluator.fromSpec(found.spec.value, {
    cache: opts.cache,
  });
  if (!evaluator.ok) throw new Error(evaluator.value);
  if (!opts.bundled) {
    return { spec: found.spec.value, evaluator: evaluator.value };
  }
  // Precomputed: the sidebar shows no charts (jsdom has no canvas).
  const bundle = await createRelativeValuesBundle({
    definition: found.spec.value.definition,
    evaluator: evaluator.value,
    meta: { variableName: found.name },
  });
  return {
    spec: found.spec.value,
    evaluator: ModelEvaluator.fromBundle(bundle),
  };
}

const sizes = (values: string, recommendedUnit: string) => `
sizes = {
  values: { ${values} },
  recommendedUnit: "${recommendedUnit}",
}`;
const ALL = `small: 1, medium: 3 to 6, large: 10 to 30, huge: 50 to 200`;

function Dashboard({ v }: { v: Version }) {
  return (
    <RelativeValuesDashboard
      definition={v.spec.definition}
      evaluator={v.evaluator}
      precompute={false}
    />
  );
}

function unitOf(container: HTMLElement): string | null {
  return (
    container.querySelector("[data-rv-unit]")?.getAttribute("data-rv-unit") ??
    null
  );
}

function clickCompass(container: HTMLElement, id: string) {
  const compass = container.querySelector(`[data-rv-compass="${id}"]`);
  if (!compass) throw new Error(`No compass for ${id}`);
  fireEvent.click(compass);
}

function clickCell(container: HTMLElement, id: string) {
  const cell = container.querySelector(
    `[data-testid="rv-list-row"][data-item="${id}"] [data-rv-cell]`
  );
  if (!cell) throw new Error(`No value cell for ${id}`);
  fireEvent.click(cell);
}

// Dashboard props other than the source.
type Extra = Omit<
  RelativeValuesDashboardProps,
  "definition" | "evaluator" | "bundle" | "spec"
>;

// A dashboard with more props; re-rendered with new versions as live reloads.
function withProps(extra: Extra): FC<{ v: Version }> {
  const WithProps: FC<{ v: Version }> = ({ v }) => (
    <RelativeValuesDashboard
      definition={v.spec.definition}
      evaluator={v.evaluator}
      precompute={false}
      {...extra}
    />
  );
  return WithProps;
}

const NO_LARGE = `small: 1, medium: 3 to 6, huge: 50 to 200`;

// Removes the item "large", then brings it back; returns what `read` gives
// before, without and with it.
async function removeAndRestore<T>(
  Dashboard: FC<{ v: Version }>,
  read: (container: HTMLElement) => T,
  recommended: [string, string, string] = ["small", "medium", "huge"],
  before?: () => void
): Promise<T[]> {
  const { container, rerender } = render(
    <Dashboard v={await version(sizes(ALL, recommended[0]))} />
  );
  if (before) {
    await act(async () => before());
  }
  const seen = [read(container)];
  const without = await version(sizes(NO_LARGE, recommended[1]));
  await act(async () => {
    rerender(<Dashboard v={without} />);
  });
  seen.push(read(container));
  const restored = await version(sizes(ALL, recommended[2]));
  await act(async () => {
    rerender(<Dashboard v={restored} />);
  });
  seen.push(read(container));
  return seen;
}

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

describe("ListView unit", () => {
  test("follows recommendedUnit until the user picks one", async () => {
    const v1 = await version(sizes(ALL, "small"));
    const { container, rerender } = render(<Dashboard v={v1} />);
    expect(unitOf(container)).toBe("small");

    rerender(<Dashboard v={await version(sizes(ALL, "medium"))} />);
    expect(unitOf(container)).toBe("medium");

    clickCompass(container, "large");
    expect(unitOf(container)).toBe("large");

    // A picked unit stays when recommendedUnit changes.
    rerender(<Dashboard v={await version(sizes(ALL, "huge"))} />);
    expect(unitOf(container)).toBe("large");
  });

  test("falls back to recommendedUnit when the picked unit is removed", async () => {
    const { container, rerender } = render(
      <Dashboard v={await version(sizes(ALL, "small"))} />
    );
    clickCompass(container, "large");
    expect(unitOf(container)).toBe("large");

    const removed = await version(
      sizes(`small: 1, medium: 3 to 6, huge: 50 to 200`, "medium")
    );
    await act(async () => {
      rerender(<Dashboard v={removed} />);
    });
    expect(unitOf(container)).toBe("medium");
    // No cell refers to the removed item.
    expect(container.textContent).not.toMatch(/Dict property not found/);

    // The pick was cleared: the unit follows recommendedUnit again, also if
    // the item comes back.
    await act(async () => {
      rerender(<Dashboard v={await version(sizes(ALL, "huge"))} />);
    });
    expect(unitOf(container)).toBe("huge");
  });

  test("a controlled unit keeps its raw id: it's the unit again when the item comes back", async () => {
    // Host state (a URL, saved preferences) isn't forgotten, unlike a unit
    // picked in the dashboard (see "Unknown or stale ids" in the README).
    const Controlled = ({ v }: { v: Version }) => (
      <RelativeValuesDashboard
        definition={v.spec.definition}
        evaluator={v.evaluator}
        precompute={false}
        state={{ unit: "large" }}
        onStateChange={() => {}}
      />
    );
    const { container, rerender } = render(
      <Controlled v={await version(sizes(ALL, "small"))} />
    );
    expect(unitOf(container)).toBe("large");
    await act(async () => {
      rerender(
        <Controlled
          v={await version(
            sizes(`small: 1, medium: 3 to 6, huge: 50 to 200`, "medium")
          )}
        />
      );
    });
    expect(unitOf(container)).toBe("medium");
    await act(async () => {
      rerender(<Controlled v={await version(sizes(ALL, "huge"))} />);
    });
    expect(unitOf(container)).toBe("large");
  });

  // Only the user's own picks are forgotten (QA #28): values from the host
  // (`defaultState`, e.g. saved preferences, and `apiRef`) keep their raw
  // ids, as controlled state does.
  test("a unit from defaultState is the unit again when its item comes back", async () => {
    expect(
      await removeAndRestore(
        withProps({ defaultState: { unit: "large" } }),
        unitOf
      )
    ).toEqual(["large", "medium", "large"]);
  });

  test("a unit set with apiRef is the unit again when its item comes back", async () => {
    const api = createRef<RelativeValuesHandle>();
    expect(
      await removeAndRestore(
        withProps({ apiRef: api }),
        unitOf,
        undefined,
        () => api.current?.setState({ unit: "large" })
      )
    ).toEqual(["large", "medium", "large"]);
  });

  test("a pick over a defaultState unit is forgotten; the host's unit stays", async () => {
    // The compass sets the table's unit (`clusterUnits`), over the host's
    // `unit`: once the pick is forgotten, the table is in the host's unit.
    const Default = withProps({ defaultState: { unit: "huge" } });
    const { container, rerender } = render(
      <Default v={await version(sizes(ALL, "small"))} />
    );
    expect(unitOf(container)).toBe("huge");
    clickCompass(container, "large");
    expect(unitOf(container)).toBe("large");
    await act(async () => {
      rerender(<Default v={await version(sizes(NO_LARGE, "medium"))} />);
    });
    expect(unitOf(container)).toBe("huge");
    await act(async () => {
      rerender(<Default v={await version(sizes(ALL, "small"))} />);
    });
    expect(unitOf(container)).toBe("huge");
  });

  test("per table: picked units are forgotten, defaultState ones aren't", async () => {
    const clustered = (values: string) => `
sizes = {
  items: [
    { id: "a1", clusterId: "a" }, { id: "a2", clusterId: "a" },
    ${values.includes("a3") ? `{ id: "a3", clusterId: "a" },` : ""}
    { id: "b1", clusterId: "b" }, { id: "b2", clusterId: "b" },
    ${values.includes("b3") ? `{ id: "b3", clusterId: "b" },` : ""}
  ],
  clusters: [
    { id: "a", recommendedUnit: "a1" },
    { id: "b", recommendedUnit: "b1" },
  ],
  values: { ${values} },
}`;
    const all = `a1: 1, a2: 2 to 3, a3: 4 to 5, b1: 1, b2: 2 to 3, b3: 4 to 5`;
    const none = `a1: 1, a2: 2 to 3, b1: 1, b2: 2 to 3`;
    const Clustered = withProps({
      defaultState: { clusterUnits: { a: "a3" } },
    });
    const units = (container: HTMLElement) =>
      [...container.querySelectorAll("[data-rv-unit]")].map((el) =>
        el.getAttribute("data-rv-unit")
      );
    const { container, rerender } = render(
      <Clustered v={await version(clustered(all))} />
    );
    clickCompass(container, "b3");
    expect(units(container)).toEqual(["a3", "b3"]);
    await act(async () => {
      rerender(<Clustered v={await version(clustered(none))} />);
    });
    expect(units(container)).toEqual(["a1", "b1"]);
    await act(async () => {
      rerender(<Clustered v={await version(clustered(all))} />);
    });
    // The host's unit for "a" is back; the user's pick for "b" was forgotten.
    expect(units(container)).toEqual(["a3", "b1"]);
  });

  test("falls back to the first item without a recommendedUnit", async () => {
    const { container } = render(
      <Dashboard v={await version(`spec = { values: { b: 1, a: 2 } }`)} />
    );
    expect(unitOf(container)).toBe("b");
  });
});

describe("ListView sidebar", () => {
  const sidebar = (container: HTMLElement) =>
    container.querySelector('[data-testid="rv-pair-sidebar"]');
  const closeButton = (container: HTMLElement) =>
    container.querySelector<HTMLButtonElement>(
      '[data-testid="rv-pair-sidebar"] button[aria-label="Close pair details"]'
    );
  // Lays the list out at a width (jsdom has no layout: 0, a drawer).
  const listWidth = (width: number) =>
    jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        return {
          width: this.hasAttribute("data-rv-list") ? width : 0,
          height: 0,
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          toJSON: () => ({}),
        } as DOMRect;
      });

  test("a picked pair is forgotten when its item disappears; a defaultState pair isn't", async () => {
    const open = (container: HTMLElement) => !!sidebar(container);
    const Picked = withProps({});
    const { container, rerender } = render(
      <Picked v={await version(sizes(ALL, "small"))} />
    );
    clickCell(container, "large");
    expect(open(container)).toBe(true);
    await act(async () => {
      rerender(<Picked v={await version(sizes(NO_LARGE, "small"))} />);
    });
    expect(open(container)).toBe(false);
    await act(async () => {
      rerender(<Picked v={await version(sizes(ALL, "small"))} />);
    });
    expect(open(container)).toBe(false);
    cleanup();

    expect(
      await removeAndRestore(
        withProps({ defaultState: { selectedPair: ["large", "small"] } }),
        open,
        ["small", "small", "small"]
      )
    ).toEqual([true, false, true]);
  });

  test("a locked pair comes back with its item", async () => {
    // Cell clicks can't reopen a locked pair, so it must not be forgotten.
    expect(
      await removeAndRestore(
        withProps({
          defaultState: { selectedPair: ["large", "small"] },
          locked: ["selectedPair"],
        }),
        (container) => !!sidebar(container),
        ["small", "small", "small"]
      )
    ).toEqual([true, false, true]);
  });

  test("a failed comparison's sidebar has its error and a focused close button", async () => {
    const v = await version(
      `spec = {
        items: ["ok", "broken"],
        fn: {|a, b| if a == "broken" || b == "broken" then throw("No estimate for broken") else [1, 2]},
      }`
    );
    const { container } = render(<Dashboard v={v} />);
    clickCell(container, "broken");
    expect(sidebar(container)?.getAttribute("data-mode")).toBe("drawer");
    expect(
      container.querySelector("[data-rv-pair-error]")?.textContent
    ).toMatch(/No estimate for broken/);
    const close = closeButton(container);
    expect(close).not.toBeNull();
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(close as Element, { key: "Escape" });
    expect(sidebar(container)).toBeNull();

    clickCell(container, "broken");
    fireEvent.click(closeButton(container) as Element);
    expect(sidebar(container)).toBeNull();
  });

  test("focus moves to the drawer only after a click in the list", async () => {
    const v = await version(sizes(ALL, "small"), { bundled: true });
    const api = createRef<RelativeValuesHandle>();
    const Host: FC = () => (
      <>
        <input data-testid="host-input" autoFocus />
        <RelativeValuesDashboard
          definition={v.spec.definition}
          evaluator={v.evaluator}
          precompute={false}
          apiRef={api}
          defaultState={{ selectedPair: ["medium", "small"] }}
        />
      </>
    );
    const { container, getByTestId } = render(<Host />);
    const input = getByTestId("host-input");
    // Opened by the host on mount: the host keeps its focus.
    expect(sidebar(container)?.getAttribute("data-mode")).toBe("drawer");
    expect(document.activeElement).toBe(input);
    // …and by apiRef.
    await act(async () => {
      api.current?.setState({ selectedPair: ["huge", "small"] });
    });
    expect(sidebar(container)?.textContent).toContain("huge");
    expect(document.activeElement).toBe(input);
    // A click on a value cell: focus on the close button, for Esc.
    clickCell(container, "large");
    expect(sidebar(container)?.textContent).toContain("large");
    expect(document.activeElement).toBe(closeButton(container));
  });

  test("a pair picked in the grid doesn't open the drawer over the list", async () => {
    const v = await version(sizes(ALL, "small"), { bundled: true });
    const Tabs: FC<{ tab: "list" | "grid" }> = ({ tab }) => (
      <RelativeValuesDashboard
        definition={v.spec.definition}
        evaluator={v.evaluator}
        precompute={false}
        tab={tab}
        onTabChange={() => {}}
      />
    );
    const { container, rerender } = render(<Tabs tab="grid" />);
    const gridCell = container.querySelector(
      '[data-testid="rv-grid-cell"][data-row="medium"][data-col="large"]'
    );
    if (!gridCell) throw new Error("No grid cell");
    fireEvent.click(gridCell);
    expect(container.querySelector("[data-rv-selected]")).not.toBeNull();

    rerender(<Tabs tab="list" />);
    expect(container.querySelector("[data-rv-list]")).not.toBeNull();
    expect(sidebar(container)).toBeNull();
    // A click on that row's value cell opens its own pair (not a toggle of
    // the hidden one), with focus.
    clickCell(container, "medium");
    expect(sidebar(container)?.getAttribute("data-mode")).toBe("drawer");
    expect(
      container
        .querySelector('[data-rv-part="sidebar"]')
        ?.getAttribute("data-rv-pair-denominator")
    ).toBe("small");
    expect(document.activeElement).toBe(closeButton(container));
  });

  test("a wide list shows a pair picked in the grid in its column", async () => {
    listWidth(1200);
    const v = await version(sizes(ALL, "small"), { bundled: true });
    const Tabs: FC<{ tab: "list" | "grid" }> = ({ tab }) => (
      <RelativeValuesDashboard
        definition={v.spec.definition}
        evaluator={v.evaluator}
        precompute={false}
        tab={tab}
        onTabChange={() => {}}
      />
    );
    const { container, rerender } = render(<Tabs tab="grid" />);
    const gridCell = container.querySelector(
      '[data-testid="rv-grid-cell"][data-row="medium"][data-col="large"]'
    );
    if (!gridCell) throw new Error("No grid cell");
    fireEvent.click(gridCell);
    rerender(<Tabs tab="list" />);
    expect(sidebar(container)?.getAttribute("data-mode")).toBe("column");
    expect(
      container
        .querySelector('[data-rv-part="sidebar"]')
        ?.getAttribute("data-rv-pair-denominator")
    ).toBe("large");
  });

  test("a locked pair is never a drawer, and has no close button", async () => {
    for (const [width, mode] of [
      // Narrow: below the tables, not over the values.
      [0, "below"],
      [1200, "column"],
    ] as const) {
      listWidth(width);
      for (const props of [
        // Controlled without onStateChange: locked.
        { state: { selectedPair: ["medium", "small"] as const } },
        {
          defaultState: { selectedPair: ["medium", "small"] as const },
          locked: ["selectedPair" as const],
        },
      ]) {
        const v = await version(sizes(ALL, "small"), { bundled: true });
        const { container } = render(
          <RelativeValuesDashboard
            definition={v.spec.definition}
            evaluator={v.evaluator}
            precompute={false}
            {...props}
          />
        );
        expect(
          container
            .querySelector("[data-rv-list]")
            ?.getAttribute("data-rv-sidebar-mode")
        ).toBe(mode);
        expect(sidebar(container)?.getAttribute("data-mode")).toBe(mode);
        expect(closeButton(container)).toBeNull();
        fireEvent.keyDown(sidebar(container) as Element, { key: "Escape" });
        expect(sidebar(container)).not.toBeNull();
        cleanup();
      }
      jest.restoreAllMocks();
    }
  });

  test("the drawer is over the tables, not the toolbar, and passes clicks below its panel", async () => {
    const { container } = render(
      <Dashboard v={await version(sizes(ALL, "small"), { bundled: true })} />
    );
    clickCell(container, "medium");
    const drawer = sidebar(container);
    const toolbar = container.querySelector('[data-rv-part="toolbar"]');
    const table = container.querySelector('[data-rv-part="list-table"]');
    expect(drawer?.getAttribute("data-mode")).toBe("drawer");
    expect(toolbar).not.toBeNull();
    // Positioned against the tables' container.
    expect(drawer?.parentElement?.contains(table ?? null)).toBe(true);
    expect(drawer?.parentElement?.contains(toolbar)).toBe(false);
    expect(drawer?.classList.contains("pointer-events-none")).toBe(true);
    expect(
      drawer
        ?.querySelector('[data-rv-part="sidebar"]')
        ?.classList.contains("pointer-events-auto")
    ).toBe(true);
    // Its z-index stays inside the list (below host sticky headers).
    expect(
      container.querySelector("[data-rv-list]")?.classList.contains("isolate")
    ).toBe(true);
  });

  test("shows current names and closes when an item disappears", async () => {
    const named = (mediumName: string, values = ALL) => `
sizes = {
  items: [
    { id: "small", name: "Small" },
    { id: "medium", name: "${mediumName}" },
    ${values.includes("large") ? `{ id: "large", name: "Large" },` : ""}
    { id: "huge", name: "Huge" },
  ],
  values: { ${values} },
  recommendedUnit: "small",
}`;
    const { container, rerender } = render(
      <Dashboard v={await version(named("Medium"), { bundled: true })} />
    );
    clickCell(container, "medium");
    expect(sidebar(container)?.textContent).toContain("Medium");

    await act(async () => {
      rerender(
        <Dashboard v={await version(named("Mid-sized"), { bundled: true })} />
      );
    });
    expect(sidebar(container)?.textContent).toContain("Mid-sized");

    clickCell(container, "large");
    expect(sidebar(container)?.textContent).toContain("Large");
    await act(async () => {
      rerender(
        <Dashboard
          v={await version(
            named("Mid-sized", `small: 1, medium: 3 to 6, huge: 50 to 200`),
            { bundled: true }
          )}
        />
      );
    });
    expect(sidebar(container)).toBeNull();
  });

  test("Esc and the close button close it", async () => {
    const { container } = render(
      <Dashboard v={await version(sizes(ALL, "small"), { bundled: true })} />
    );
    clickCell(container, "medium");
    const panel = sidebar(container);
    expect(panel).not.toBeNull();
    // jsdom has no layout: the measured width is 0, so the sidebar is a
    // drawer over the table.
    expect(panel?.getAttribute("data-mode")).toBe("drawer");
    fireEvent.keyDown(panel as Element, { key: "Escape" });
    expect(sidebar(container)).toBeNull();

    clickCell(container, "huge");
    const close = container.querySelector(
      '[data-testid="rv-pair-sidebar"] button[aria-label="Close pair details"]'
    );
    if (!close) throw new Error("No close button");
    fireEvent.click(close);
    expect(sidebar(container)).toBeNull();
  });
});

// QA #15: the List view showed n cells but computed all n² pairs, only for
// its color percentiles.
describe("ListView computes only the pairs it shows", () => {
  test("n pairs for n items", async () => {
    const n = 30;
    const values = Array.from(
      { length: n },
      (_, i) => `item${i}: ${i + 1} to ${i + 3}`
    ).join(", ");
    const cache = new InMemoryRelativeValuesCache();
    const v = await version(
      `catalog = { values: { ${values} }, recommendedUnit: "item0" }`,
      { cache }
    );
    const { container } = render(<Dashboard v={v} />);
    expect(
      container.querySelectorAll('[data-testid="rv-list-row"]')
    ).toHaveLength(n);
    expect(cache.size).toBe(n);
  });
});
