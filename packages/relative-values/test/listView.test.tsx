/**
 * @jest-environment ./test/JSDOMEnvironment.ts
 */
import { afterEach, describe, expect, test } from "@jest/globals";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

import { run } from "@quri/squiggle-lang";

import {
  createRelativeValuesBundle,
  findRelativeValuesExports,
  InMemoryRelativeValuesCache,
  ModelEvaluator,
  RelativeValuesDashboard,
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

afterEach(cleanup);

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
