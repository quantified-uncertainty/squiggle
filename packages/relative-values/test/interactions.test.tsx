/**
 * @jest-environment ./test/JSDOMEnvironment.ts
 */
// Host control: several changes in one event, rejected changes, scrolling,
// and computation shared between providers.
import {
  afterEach,
  beforeAll,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createRef, FC, useLayoutEffect, useRef, useState } from "react";

import {
  ModelEvaluator,
  type RelativeValuesDefinition,
  type RelativeValuesHandle,
  RelativeValuesBundleDashboard,
  RelativeValuesProvider,
  RelativeValuesSingleView,
  type RelativeValuesSorts,
  type RelativeValuesState,
  type RelativeValuesStateInput,
  relativeValuesSpecFromCode,
  useRelativeValues,
} from "../src/index.js";
import { readPortfolioBundle } from "./portfolio.js";

const bundle = readPortfolioBundle();

const scrolled: Element[] = [];
beforeAll(() => {
  // Not implemented by jsdom.
  Element.prototype.scrollIntoView = function (this: Element) {
    scrolled.push(this);
  };
});
afterEach(() => {
  cleanup();
  scrolled.length = 0;
});

const rows = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-rv-part="list-row"]')].map(
    (el) => el.getAttribute("data-rv-item") ?? ""
  );

const liveDefinition = (ids: string[]): RelativeValuesDefinition => ({
  title: "Live",
  items: ids.map((id) => ({ id, name: id, clusterId: null, description: "" })),
  clusters: [],
});

async function liveEvaluator(code: string) {
  const result = await ModelEvaluator.create(code, "spec");
  if (!result.ok) throw new Error(result.value);
  return result.value;
}

describe("several changes in one event", () => {
  // The README's URL pattern: every URL key is controlled, and the host
  // writes all of them from each `next`.
  const URLHost: FC<{ api: React.RefObject<RelativeValuesHandle | null> }> = ({
    api,
  }) => {
    const [state, setState] = useState<RelativeValuesStateInput>({
      view: "list",
      unit: null,
      sort: { mode: "default", desc: false },
      gridMode: "full",
    });
    return (
      <>
        <p data-host-state={JSON.stringify(state)} />
        <RelativeValuesBundleDashboard
          bundle={bundle}
          apiRef={api}
          state={state}
          onStateChange={(next) =>
            setState({
              view: next.view,
              unit: next.unit,
              sort: next.sort,
              gridMode: next.gridMode,
            })
          }
        />
      </>
    );
  };
  const hostState = (container: HTMLElement) =>
    JSON.parse(
      container
        .querySelector("[data-host-state]")
        ?.getAttribute("data-host-state") ?? "{}"
    ) as RelativeValuesStateInput;

  test("the second change builds on the first, with controlled keys", () => {
    const api = createRef<RelativeValuesHandle>();
    const { container } = render(<URLHost api={api} />);
    act(() => {
      api.current?.setState({ unit: "sso" });
      api.current?.setState({ sort: { mode: "median", desc: true } });
    });
    expect(hostState(container)).toMatchObject({
      unit: "sso",
      sort: { mode: "median", desc: true },
    });
    act(() => {
      api.current?.setState({ view: "grid" });
      api.current?.setState({ gridMode: "half" });
    });
    expect(hostState(container)).toMatchObject({
      view: "grid",
      gridMode: "half",
    });
    expect(container.querySelector('[data-rv-part="grid"]')).not.toBeNull();
  });

  test("actions under a provider: setUnit then setSort in one handler", () => {
    const changes: RelativeValuesState<string>[] = [];
    const Toolbar: FC = () => {
      const rv = useRelativeValues({ requires: "none" });
      return (
        <button
          type="button"
          onClick={() => {
            rv.actions.setUnit("sso");
            rv.actions.setSort({ mode: "median", desc: true });
          }}
        >
          Rank
        </button>
      );
    };
    const Host: FC = () => {
      const [state, setState] = useState<RelativeValuesStateInput>({
        unit: null,
        sort: { mode: "default" },
      });
      return (
        <RelativeValuesProvider
          bundle={bundle}
          state={state}
          onStateChange={(next) => {
            changes.push(next);
            setState({ unit: next.unit, sort: next.sort });
          }}
        >
          <Toolbar />
          <p data-unit={String(state.unit)} data-sort={state.sort?.mode} />
        </RelativeValuesProvider>
      );
    };
    const { container } = render(<Host />);
    fireEvent.click(screen.getByText("Rank"));
    expect(changes.map((next) => [next.unit, next.sort.mode])).toEqual([
      ["sso", "default"],
      ["sso", "median"],
    ]);
    const p = container.querySelector("p");
    expect(p?.getAttribute("data-unit")).toBe("sso");
    expect(p?.getAttribute("data-sort")).toBe("median");
  });

  test("a rejected proposal doesn't outlive its event", async () => {
    const changes: RelativeValuesState<string>[] = [];
    const api = createRef<RelativeValuesHandle>();
    render(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        apiRef={api}
        state={{ unit: "auditLog" }}
        // Rejects everything: never passes a new state.
        onStateChange={(next) => changes.push(next)}
      />
    );
    act(() => api.current?.setState({ unit: "sso" }));
    expect(changes[0].unit).toBe("sso");
    // The event is over: the next change starts from the effective state.
    await act(async () => {
      await Promise.resolve();
    });
    act(() => api.current?.setState({ gridMode: "half" }));
    expect(changes[1].unit).toBe("auditLog");
    expect(api.current?.getState().unit).toBe("auditLog");
  });
});

describe("controlled search", () => {
  const searchBox = () => screen.getByRole("textbox") as HTMLInputElement;

  test("a rejected change resets the search box", () => {
    const changes: string[] = [];
    render(
      <RelativeValuesSingleView
        bundle={bundle}
        view="list"
        state={{ search: "" }}
        onStateChange={(next) => changes.push(next.search)}
      />
    );
    act(() => {
      fireEvent.change(searchBox(), { target: { value: "audit" } });
    });
    expect(changes).toEqual(["audit"]);
    expect(searchBox().value).toBe("");
  });

  test("an accepted change stays, uncontrolled or controlled", () => {
    const Host: FC = () => {
      const [search, setSearch] = useState("");
      return (
        <RelativeValuesSingleView
          bundle={bundle}
          view="list"
          state={{ search }}
          onStateChange={(next) => setSearch(next.search)}
        />
      );
    };
    const { container } = render(<Host />);
    act(() => {
      fireEvent.change(searchBox(), { target: { value: "audit" } });
    });
    expect(searchBox().value).toBe("audit");
    expect(rows(container)).toEqual(["auditLog"]);
    cleanup();
    render(<RelativeValuesSingleView bundle={bundle} view="list" />);
    act(() => {
      fireEvent.change(searchBox(), { target: { value: "audit" } });
    });
    expect(searchBox().value).toBe("audit");
  });
});

describe("apiRef.scrollTo", () => {
  test("scrolls a list row's first cell (rows are display: contents)", () => {
    const style = document.createElement("style");
    style.textContent = ".contents { display: contents; }";
    document.head.append(style);
    const api = createRef<RelativeValuesHandle>();
    const { container } = render(
      <RelativeValuesBundleDashboard bundle={bundle} apiRef={api} />
    );
    act(() => api.current?.scrollTo({ item: "pricingExperiment" }));
    expect(scrolled).toHaveLength(1);
    const row = container.querySelector('[data-rv-item="pricingExperiment"]');
    expect(scrolled[0]).not.toBe(row);
    expect(scrolled[0]).toBe(row?.firstElementChild);
    style.remove();
  });
});

describe("custom sorts", () => {
  test("a new compare function re-sorts (e.g. host data that loads later)", () => {
    const Host: FC<{ revenue: Record<string, number> }> = ({ revenue }) => {
      const sorts: RelativeValuesSorts = {
        revenue: {
          label: "Revenue",
          compare: (a, b) =>
            (revenue[a.item.id] ?? 0) - (revenue[b.item.id] ?? 0),
        },
      };
      return (
        <RelativeValuesSingleView
          bundle={bundle}
          view="list"
          sorts={sorts}
          state={{ sort: { mode: "revenue", desc: true }, limit: 3 }}
          display={{ list: { groupByCluster: false } }}
        />
      );
    };
    const { container, rerender } = render(<Host revenue={{}} />);
    expect(rows(container)).toEqual(["sso", "auditLog", "usageBilling"]);
    rerender(
      <Host
        revenue={{ partnerApi: 3, pricingExperiment: 2, healthScores: 1 }}
      />
    );
    expect(rows(container)).toEqual([
      "partnerApi",
      "pricingExperiment",
      "healthScores",
    ]);
  });
});

describe("computation", () => {
  test("pairs that another provider computed after this render", async () => {
    const ids = ["a", "b", "c", "d"];
    const evaluator = await liveEvaluator(
      `spec = { values: { a: 1, b: 2 to 5, c: 3 to 8, d: 10 to 20 } }`
    );
    const definition = liveDefinition(ids);
    const Status: FC<{ only: string[] }> = ({ only }) => {
      const rv = useRelativeValues({
        requires: "items",
        overrides: { ids: only },
      });
      return <p data-status={rv.status} />;
    };
    // Computes every pair synchronously in a layout effect: after the
    // provider rendered, before its effects run (like a second provider
    // on the same evaluator).
    const Filler: FC<{ fill: boolean }> = ({ fill }) => {
      useLayoutEffect(() => {
        if (fill) {
          evaluator.compareAll(ids);
        }
      }, [fill]);
      return null;
    };
    const tree = (only: string[], fill: boolean) => (
      <>
        <RelativeValuesProvider
          definition={definition}
          evaluator={evaluator}
          precompute="visible"
        >
          <Status only={only} />
        </RelativeValuesProvider>
        <Filler fill={fill} />
      </>
    );
    const { container, rerender } = render(tree(["a", "b"], false));
    const status = () =>
      container.querySelector("[data-status]")?.getAttribute("data-status");
    await waitFor(() => expect(status()).toBe("ready"));
    expect(evaluator.isCached([["d", "c"]])).toBe(false);
    rerender(tree(["a", "b", "c", "d"], true));
    await waitFor(() => expect(status()).toBe("ready"));
  });

  test("two providers on one live evaluator both finish; whenReady resolves", async () => {
    const ids = ["a", "b", "c", "d", "e", "f"];
    const evaluator = await liveEvaluator(
      `spec = { values: { a: 1, b: 2 to 5, c: 3 to 8, d: 10 to 20, e: 1 to 3, f: 4 to 6 } }`
    );
    const definition = liveDefinition(ids);
    const first = createRef<RelativeValuesHandle<string>>();
    const second = createRef<RelativeValuesHandle<string>>();
    const state = { unit: "d", sort: { mode: "median", desc: true } };
    const { container } = render(
      <>
        <RelativeValuesProvider
          definition={definition}
          evaluator={evaluator}
          precompute
          apiRef={first}
          state={{ ...state, limit: 3 }}
        >
          <RelativeValuesSingleView view="list" />
        </RelativeValuesProvider>
        <RelativeValuesProvider
          definition={definition}
          evaluator={evaluator}
          precompute
          apiRef={second}
          state={state}
        >
          <RelativeValuesSingleView view="list" />
        </RelativeValuesProvider>
      </>
    );
    // Created before anything is computed; resolved once both are ready.
    const ready = Promise.all([
      first.current?.whenReady(),
      second.current?.whenReady(),
    ]);
    let resolved = false;
    void ready.then(() => {
      resolved = true;
    });
    await waitFor(() =>
      expect(container.querySelectorAll("[data-rv-ready]")).toHaveLength(2)
    );
    await act(async () => {
      await ready;
    });
    expect(resolved).toBe(true);
    expect(container.querySelector("[data-rv-computing]")).toBeNull();
    const lists = container.querySelectorAll('[data-rv-part="list"]');
    expect(lists).toHaveLength(2);
    expect(lists[0].getAttribute("data-rv-count")).toBe("3");
    expect(lists[1].getAttribute("data-rv-count")).toBe("6");
  });

  test("a requires function that changes registers its new pairs", async () => {
    const ids = ["a", "b", "c", "d"];
    const evaluator = await liveEvaluator(
      `spec = { values: { a: 1, b: 2 to 5, c: 3 to 8, d: 10 to 20 } }`
    );
    const definition = liveDefinition(ids);
    const Widget: FC<{ count: number }> = ({ count }) => {
      const rv = useRelativeValues({
        requires: (data) => {
          const items = data.universe.slice(0, count);
          return items.flatMap((a) => items.map((b) => [a.id, b.id] as const));
        },
      });
      return (
        <p
          data-status={rv.status}
          data-value={rv.compare(ids[count - 1], "a")?.ok ? "yes" : "no"}
        />
      );
    };
    const tree = (count: number) => (
      <RelativeValuesProvider
        definition={definition}
        evaluator={evaluator}
        precompute="visible"
      >
        <Widget count={count} />
      </RelativeValuesProvider>
    );
    const { container, rerender } = render(tree(2));
    const p = () => container.querySelector("p");
    await waitFor(() => expect(p()?.getAttribute("data-status")).toBe("ready"));
    expect(evaluator.isCached([["d", "a"]])).toBe(false);
    rerender(tree(4));
    await waitFor(() => expect(p()?.getAttribute("data-status")).toBe("ready"));
    expect(evaluator.isCached([["d", "a"]])).toBe(true);
    expect(p()?.getAttribute("data-value")).toBe("yes");
  });

  test("no unknown-id warnings while a spec is loading", async () => {
    const code = `spec = { values: { rbac: 1, darkMode: 2 to 5, sso: 3 to 8 } }`;
    const spec = await relativeValuesSpecFromCode(code, "spec");
    if (!spec.ok) throw new Error(spec.value);
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = render(
      <RelativeValuesSingleView
        spec={spec.value}
        modelCode={code}
        view="list"
        state={{
          ids: ["rbac", "darkMode"],
          unit: "darkMode",
          selectedItem: "rbac",
        }}
        display={{ list: { groupByCluster: false } }}
      />
    );
    await waitFor(() => expect(rows(container)).toEqual(["rbac", "darkMode"]));
    const messages = warn.mock.calls.map((call) => String(call[0]));
    expect(messages.filter((m) => /unknown/.test(m))).toEqual([]);
    warn.mockRestore();
  });
});
