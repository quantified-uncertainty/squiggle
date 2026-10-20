/**
 * @jest-environment ./test/JSDOMEnvironment.ts
 */
import { beforeAll, describe, expect, jest, test } from "@jest/globals";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createRef, FC, StrictMode, useState } from "react";

import {
  type RelativeValuesCustomSort,
  RelativeValuesDashboard,
  type RelativeValuesHandle,
  RelativeValuesBundleDashboard,
  RelativeValuesProvider,
  RelativeValuesSearchBox,
  RelativeValuesSingleView,
  type RelativeValuesState,
  type RelativeValuesStateChange,
  type RelativeValuesStateInput,
  type RelativeValuesTab,
  ModelEvaluator,
  useRelativeValues,
  useRelativeValuesContext,
  useRelativeValuesDispatch,
} from "../src/index.js";
import { readPortfolioBundle } from "./portfolio.js";

const bundle = readPortfolioBundle();

beforeAll(() => {
  // Not implemented by jsdom.
  Element.prototype.scrollIntoView = jest.fn();
});

const rows = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-rv-part="list-row"]')].map(
    (el) => el.getAttribute("data-rv-item") ?? ""
  );
const part = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-rv-part="${name}"]`);
const tabButton = (name: string) => {
  const button = screen
    .getAllByRole("button")
    .find((b) => b.textContent?.trim() === name);
  if (!button) throw new Error(`No tab ${name}`);
  return button;
};

type Changes = [
  RelativeValuesState<string>,
  RelativeValuesStateChange<string>,
][];
const recorder = () => {
  const changes: Changes = [];
  const onStateChange = (
    next: RelativeValuesState<string>,
    change: RelativeValuesStateChange<string>
  ) => {
    changes.push([next, change]);
  };
  return { changes, onStateChange };
};

describe("controlled and uncontrolled state", () => {
  test("an uncontrolled click changes the view and reports the change", () => {
    const { changes, onStateChange } = recorder();
    const { container } = render(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        onStateChange={onStateChange}
      />
    );
    expect(part(container, "list")).not.toBeNull();
    fireEvent.click(tabButton("Grid"));
    expect(part(container, "grid")).not.toBeNull();
    expect(changes).toHaveLength(1);
    const [next, change] = changes[0];
    expect(next.view).toBe("grid");
    expect(change).toMatchObject({
      reason: "view",
      keys: ["view"],
      source: "user",
    });
    expect(change.previous.view).toBe("list");
    cleanup();
  });

  test("a controlled key doesn't move until the host passes a new state", () => {
    const { changes, onStateChange } = recorder();
    const { container, rerender } = render(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        state={{ view: "list" }}
        onStateChange={onStateChange}
      />
    );
    fireEvent.click(tabButton("Grid"));
    expect(changes.map(([next]) => next.view)).toEqual(["grid"]);
    expect(part(container, "list")).not.toBeNull();
    rerender(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        state={{ view: "grid" }}
        onStateChange={onStateChange}
      />
    );
    expect(part(container, "grid")).not.toBeNull();
    cleanup();
  });

  test("onStateChange is called once per change, never while rendering", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const calls: string[] = [];
    let rendering = false;
    const Probe: FC = () => {
      rendering = true;
      useRelativeValues({ requires: "none" });
      rendering = false;
      return null;
    };
    render(
      <StrictMode>
        <RelativeValuesProvider
          bundle={bundle}
          // Stale ids are normalized when read, never written back.
          defaultState={{ unit: "gone", clusters: ["nope"] }}
          onStateChange={(next, change) => {
            expect(rendering).toBe(false);
            calls.push(`${change.reason}:${next.search}`);
          }}
        >
          <Probe />
          <RelativeValuesSearchBox />
        </RelativeValuesProvider>
      </StrictMode>
    );
    expect(calls).toEqual([]);
    // Each fix is reported once, in development.
    expect(warn.mock.calls.map(([message]) => String(message))).toEqual([
      '[squiggle-relative-values] unit: unknown item id "gone"',
      "[squiggle-relative-values] clusters: unknown cluster ids dropped: nope",
    ]);
    warn.mockRestore();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "au" } });
    expect(calls).toEqual(["search:au"]);
    cleanup();
  });

  test("a rejected change doesn't leak when the host stops controlling the key", () => {
    const Host: FC<{ control: boolean }> = ({ control }) => (
      <RelativeValuesSingleView
        bundle={bundle}
        view="list"
        state={control ? { search: "", sort: { mode: "name" } } : undefined}
        display={{ list: { groupByCluster: false } }}
        // Rejects every change.
        onStateChange={() => {}}
      />
    );
    const { container, rerender } = render(<Host control />);
    const before = rows(container);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "audit" },
    });
    expect(rows(container)).toEqual(before);
    rerender(<Host control={false} />);
    // The last controlled values: no search, sorted by name.
    expect(rows(container)).toEqual(before);
    expect(rows(container)[0]).toBe("anomalyDetection");
    cleanup();
  });

  test("defaultState is read on mount; reset returns to it", () => {
    const api = createRef<RelativeValuesHandle>();
    const { container, rerender } = render(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        apiRef={api}
        defaultState={{ search: "audit" }}
      />
    );
    expect(rows(container)).toEqual(["auditLog"]);
    rerender(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        apiRef={api}
        defaultState={{ search: "sign" }}
      />
    );
    expect(rows(container)).toEqual(["auditLog"]);
    act(() => api.current?.setState({ search: "" }));
    expect(rows(container)).toHaveLength(15);
    act(() => api.current?.reset(["search"]));
    expect(rows(container)).toEqual(["auditLog"]);
    cleanup();
  });
});

describe("locking", () => {
  test("a controlled key without a handler is locked; its controls are hidden", () => {
    const { container } = render(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        state={{ unit: "sso", sort: { mode: "name", desc: false } }}
      />
    );
    expect(container.querySelector("[data-rv-compass]")).toBeNull();
    expect(
      [...container.querySelectorAll('[data-rv-part="list-unit"]')].every(
        (el) => el.getAttribute("data-rv-unit") === "sso"
      )
    ).toBe(true);
    // Table Settings still has the Clusters section; "Sort by" is hidden.
    fireEvent.click(tabButton("Table Settings"));
    expect(screen.queryByText("Sort by")).toBeNull();
    expect(screen.getByText("Clusters")).toBeTruthy();
    cleanup();
  });

  test("locked keys hide their controls and ignore the UI, but not the API", () => {
    const api = createRef<RelativeValuesHandle>();
    const { changes, onStateChange } = recorder();
    const { container } = render(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        apiRef={api}
        locked={["view", "search", "gridMode"]}
        onStateChange={onStateChange}
      />
    );
    expect(part(container, "tab-bar")).toBeNull();
    expect(part(container, "search")).toBeNull();
    act(() => api.current?.setState({ view: "grid" }));
    expect(part(container, "grid")).not.toBeNull();
    expect(part(container, "grid-mode")).toBeNull();
    expect(changes[0][1]).toMatchObject({ reason: "set", source: "api" });
    cleanup();
  });

  test("hiding a control doesn't lock its key", () => {
    const { container } = render(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        controls={{ list: { search: false } }}
        defaultState={{ search: "audit" }}
      />
    );
    expect(part(container, "search")).toBeNull();
    // The search chip makes the filter visible, and clears it.
    const chip = part(container, "search-chip");
    expect(chip?.textContent).toContain("Search: audit");
    fireEvent.click(screen.getByLabelText("Clear search"));
    expect(rows(container)).toHaveLength(15);
    cleanup();
  });
});

describe("aliases and the imperative handle", () => {
  test("tab / onTabChange: Studio's controlled tab keeps its tab bar", () => {
    const tabs: RelativeValuesTab[] = [];
    const Studio: FC = () => {
      const [tab, setTab] = useState<RelativeValuesTab>("list");
      return (
        <RelativeValuesBundleDashboard
          bundle={bundle}
          tab={tab}
          onTabChange={(next) => {
            tabs.push(next);
            setTab(next);
          }}
        />
      );
    };
    const { container } = render(<Studio />);
    expect(part(container, "tab-bar")).not.toBeNull();
    fireEvent.click(tabButton("Grid"));
    expect(tabs).toEqual(["grid"]);
    expect(part(container, "grid")).not.toBeNull();
    cleanup();
  });

  test("apiRef: setState, getState, getData, whenReady, scrollTo", async () => {
    const api = createRef<RelativeValuesHandle>();
    const { container } = render(
      <RelativeValuesBundleDashboard bundle={bundle} apiRef={api} />
    );
    await expect(api.current?.whenReady()).resolves.toBeUndefined();
    expect(container.querySelector("[data-rv-ready]")).not.toBeNull();
    act(() =>
      api.current?.setState((state) => ({
        ...state,
        unit: "ciSpeedup",
        sort: { mode: "median", desc: true },
        limit: 3,
      }))
    );
    expect(api.current?.getState()).toMatchObject({
      unit: "ciSpeedup",
      limit: 3,
    });
    const data = api.current?.getData();
    expect(data?.items).toHaveLength(3);
    expect(data?.unit?.id).toBe("ciSpeedup");
    expect(rows(container).sort()).toEqual(data?.items.map((i) => i.id).sort());
    act(() => api.current?.scrollTo({ item: data?.items[0].id ?? "" }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    act(() => api.current?.setState({ selectedPair: ["sso", "auditLog"] }));
    expect(
      part(container, "sidebar")?.getAttribute("data-rv-pair-numerator")
    ).toBe("sso");
    cleanup();
  });

  test("a new state literal on every render doesn't re-run the pipeline", () => {
    let comparisons = 0;
    const sorts: Record<string, RelativeValuesCustomSort> = {
      byName: {
        label: "By name",
        compare: (a, b) => {
          comparisons++;
          return a.item.name.localeCompare(b.item.name);
        },
      },
    };
    const Host: FC<{ n: number }> = ({ n }) => (
      <div data-n={n}>
        <RelativeValuesSingleView
          bundle={bundle}
          view="list"
          sorts={sorts}
          state={{ sort: { mode: "byName" } }}
          display={{ list: { groupByCluster: false } }}
          onStateChange={() => {}}
        />
      </div>
    );
    const { rerender, container } = render(<Host n={0} />);
    expect(rows(container)[0]).toBe("anomalyDetection");
    const after = comparisons;
    expect(after).toBeGreaterThan(0);
    for (let n = 1; n < 5; n++) {
      rerender(<Host n={n} />);
    }
    expect(comparisons).toBe(after);
    cleanup();
  });

  test("linked dashboards share state keys through the host", () => {
    const Linked: FC = () => {
      const [link, setLink] = useState<RelativeValuesStateInput>({
        search: "",
      });
      const onLink = (next: RelativeValuesState<string>) =>
        setLink({ search: next.search });
      return (
        <>
          <RelativeValuesSingleView
            bundle={bundle}
            view="list"
            state={link}
            onStateChange={onLink}
          />
          <RelativeValuesSingleView
            bundle={bundle}
            view="grid"
            state={link}
            onStateChange={onLink}
          />
        </>
      );
    };
    const { container } = render(<Linked />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "audit" },
    });
    expect(part(container, "grid")?.getAttribute("data-rv-count")).toBe("1");
    expect(part(container, "search-chip")?.textContent).toContain("audit");
    cleanup();
  });
});

describe("headless hook and legacy hooks", () => {
  test("useRelativeValues: rows with values, overrides stay local", () => {
    const Top: FC = () => {
      const rv = useRelativeValues({
        overrides: { sort: { mode: "median", desc: true }, limit: 4 },
      });
      return (
        <ol>
          {rv.rows.map((row) => (
            <li key={row.item.id} data-median={row.value?.median}>
              {row.item.name}
            </li>
          ))}
        </ol>
      );
    };
    const { container } = render(
      <RelativeValuesProvider bundle={bundle} defaultState={{ unit: "sso" }}>
        <Top />
        <RelativeValuesSingleView view="list" />
      </RelativeValuesProvider>
    );
    const medians = [...container.querySelectorAll("li")].map((li) =>
      Number(li.getAttribute("data-median"))
    );
    expect(medians).toHaveLength(4);
    expect(medians).toEqual([...medians].sort((a, b) => b - a));
    expect(rows(container)).toHaveLength(15);
    cleanup();
  });

  test("live mode: computing, then ready", async () => {
    const live = await ModelEvaluator.create(
      `spec = { values: { a: 1, b: 2 to 5, c: 3 to 8, d: 10 to 20 } }`,
      "spec"
    );
    if (!live.ok) throw new Error(live.value);
    const definition = {
      title: "Live",
      items: ["a", "b", "c", "d"].map((id) => ({
        id,
        name: id,
        clusterId: null,
        description: "",
      })),
      clusters: [],
    };
    const statuses: string[] = [];
    const Status: FC = () => {
      const rv = useRelativeValues({ requires: "items" });
      statuses.push(rv.status);
      return <p data-status={rv.status}>{rv.rows.length}</p>;
    };
    const { container } = render(
      <RelativeValuesProvider
        definition={definition}
        evaluator={live.value}
        precompute
      >
        <Status />
      </RelativeValuesProvider>
    );
    expect(statuses[0]).toBe("computing");
    await waitFor(() =>
      expect(container.querySelector('[data-status="ready"]')).not.toBeNull()
    );
    expect(live.value.isCached([["d", "a"]])).toBe(true);
    cleanup();
  });

  test("stale while recomputing: a new evaluator shows the previous one until computed", async () => {
    const make = async (b: string) => {
      const result = await ModelEvaluator.create(
        `spec = { values: { a: 1, b: ${b}, c: 5 } }`,
        "spec"
      );
      if (!result.ok) throw new Error(result.value);
      return result.value;
    };
    const first = await make("2");
    const second = await make("20");
    await first.computeAll(["a", "b", "c"]);
    const definition = {
      title: "Live",
      items: ["a", "b", "c"].map((id) => ({
        id,
        name: id,
        clusterId: null,
        description: "",
      })),
      clusters: [],
      recommendedUnit: "a",
    };
    const Probe: FC = () => {
      const rv = useRelativeValues({ requires: "items" });
      return (
        <p data-stale={String(rv.isStale)} data-status={rv.status}>
          {rv.rows.map((row) => row.value?.median).join(",")}
        </p>
      );
    };
    const tree = (evaluator: ModelEvaluator) => (
      <RelativeValuesProvider
        definition={definition}
        evaluator={evaluator}
        precompute
        defaultState={{ search: "" }}
      >
        <Probe />
      </RelativeValuesProvider>
    );
    const { container, rerender } = render(tree(first));
    const probe = () => container.querySelector("p");
    expect(probe()?.getAttribute("data-status")).toBe("ready");
    expect(probe()?.textContent).toBe("1,2,5");
    rerender(tree(second));
    // Still the first evaluator's values, marked stale.
    expect(probe()?.getAttribute("data-stale")).toBe("true");
    expect(probe()?.textContent).toBe("1,2,5");
    await waitFor(() =>
      expect(probe()?.getAttribute("data-stale")).toBe("false")
    );
    expect(probe()?.textContent).toBe("1,20,5");
    cleanup();
  });

  test("legacy context and dispatch keep their shape", () => {
    let legacy: ReturnType<typeof useRelativeValuesContext> | undefined;
    const Legacy: FC = () => {
      legacy = useRelativeValuesContext();
      const dispatch = useRelativeValuesDispatch();
      return (
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: "toggleCluster",
              payload: { axis: "rows", id: "research" },
            })
          }
        >
          toggle
        </button>
      );
    };
    render(
      <RelativeValuesDashboard
        definition={bundle.definition}
        evaluator={ModelEvaluator.fromBundle(bundle)}
        tabs={[{ id: "legacy", label: "Legacy", render: () => <Legacy /> }]}
      />
    );
    expect(legacy?.axisConfig.rows.filter.selectedClusters.size).toBe(4);
    expect(legacy?.gridMode).toBe("full");
    fireEvent.click(screen.getByText("toggle"));
    expect(
      legacy?.axisConfig.rows.filter.selectedClusters.has("research")
    ).toBe(false);
    expect(legacy?.axisConfig.rows.filter.selectedClusters.size).toBe(3);
    cleanup();
  });
});
