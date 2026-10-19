/**
 * @jest-environment ./test/JSDOMEnvironment.ts
 */
// Host control: slots, toolbars, the search chip, the sidebar, menus and
// densities.
import { afterEach, describe, expect, test } from "@jest/globals";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { FC, ReactElement, ReactNode, useState } from "react";

import {
  RelativeValuesBundleDashboard,
  RelativeValuesProvider,
  RelativeValuesRoot,
  RelativeValuesSingleView,
  RelativeValuesSortMenu,
  type RelativeValuesState,
} from "../src/index.js";
import { readPortfolioBundle } from "./portfolio.js";

const bundle = readPortfolioBundle();

afterEach(cleanup);

// The rendered markup (react-dom/server needs MessageChannel, which this
// jsdom lacks).
function renderToStaticMarkup(element: ReactElement): string {
  const { container } = render(element);
  const html = container.innerHTML;
  cleanup();
  return html;
}

const part = (container: ParentNode, name: string) =>
  container.querySelector(`[data-rv-part="${name}"]`);

describe("slots written inline in the host's JSX", () => {
  // The README's pattern: `components` inline, in a host that re-renders on
  // every change.
  const Host: FC<{ controlled: boolean }> = ({ controlled }) => {
    const [search, setSearch] = useState("");
    const [, setLast] = useState<RelativeValuesState<string>>();
    return (
      <RelativeValuesBundleDashboard
        bundle={bundle}
        state={controlled ? { search } : undefined}
        onStateChange={(next) => {
          setSearch(next.search);
          setLast(next);
        }}
        components={{
          Toolbar: ({ children }: { children: ReactNode }) => (
            <div className="acme-row">
              {children}
              <button type="button">Export</button>
            </div>
          ),
        }}
      />
    );
  };

  test.each([true, false])(
    "the search box isn't remounted while typing (controlled: %s)",
    (controlled) => {
      const { container } = render(<Host controlled={controlled} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      input.focus();
      for (const value of ["b", "bi", "bil"]) {
        act(() => {
          fireEvent.change(screen.getByRole("textbox"), { target: { value } });
        });
      }
      expect(screen.getByRole("textbox")).toBe(input);
      expect(document.activeElement).toBe(input);
      expect(input.value).toBe("bil");
      expect(part(container, "list")?.getAttribute("data-rv-count")).not.toBe(
        "15"
      );
      expect(screen.getByText("Export")).toBeTruthy();
    }
  );

  test("a slot with other code is remounted", () => {
    const A: FC<{ children: ReactNode }> = ({ children }) => (
      <div data-slot="a">{children}</div>
    );
    const B: FC<{ children: ReactNode }> = ({ children }) => (
      <section data-slot="b">{children}</section>
    );
    const tree = (Toolbar: FC<{ children: ReactNode }>) => (
      <RelativeValuesSingleView
        bundle={bundle}
        view="list"
        components={{ Toolbar }}
      />
    );
    const { container, rerender } = render(tree(A));
    expect(container.querySelector('[data-slot="a"]')).not.toBeNull();
    rerender(tree(B));
    expect(container.querySelector('[data-slot="a"]')).toBeNull();
    expect(container.querySelector('[data-slot="b"]')).not.toBeNull();
  });
});

describe("toolbars and the search chip", () => {
  test("list.toolbar: false shows an active search as a chip", () => {
    const html = renderToStaticMarkup(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        controls={{ list: { toolbar: false } }}
        defaultState={{ search: "a" }}
      />
    );
    expect(html).not.toContain('data-rv-part="toolbar"');
    expect(html).toContain('data-rv-part="search-chip"');
    // searchChip: false is the explicit off switch.
    const off = renderToStaticMarkup(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        controls={{ list: { toolbar: false }, searchChip: false }}
        defaultState={{ search: "a" }}
      />
    );
    expect(off).not.toContain('data-rv-part="search-chip"');
    // With the search box, no chip.
    const box = renderToStaticMarkup(
      <RelativeValuesBundleDashboard
        bundle={bundle}
        defaultState={{ search: "a" }}
      />
    );
    expect(box).not.toContain('data-rv-part="search-chip"');
  });
});

describe("sidebar", () => {
  const sidebar = (format?: { uncertainty?: "om" | "factor" | "hidden" }) =>
    renderToStaticMarkup(
      <RelativeValuesSingleView
        bundle={bundle}
        view="list"
        format={format}
        labels={{ "sidebar.close": "Fermer" }}
        defaultState={{ selectedPair: ["auditLog", "sso"] }}
      />
    );

  test("the uncertainty row follows format.uncertainty", () => {
    const om = sidebar();
    const factor = sidebar({ uncertainty: "factor" });
    const hidden = sidebar({ uncertainty: "hidden" });
    const sidebarOf = (html: string) =>
      html.slice(html.indexOf('data-rv-part="sidebar"'));
    expect(sidebarOf(om)).toMatch(
      />uncertainty<\/div><div[^>]*><span>± <\/span>/
    );
    expect(sidebarOf(factor)).toMatch(
      />uncertainty<\/div><div[^>]*><span>×\/÷ <\/span>/
    );
    expect(sidebarOf(hidden)).not.toContain(">uncertainty<");
    expect(sidebarOf(hidden)).toContain(">median<");
  });

  test("the close button's label is a label", () => {
    expect(sidebar()).toContain('aria-label="Fermer"');
  });
});

describe("menus", () => {
  test("an empty sortOptions hides Sort by (and a menu with nothing else)", () => {
    render(
      <RelativeValuesProvider bundle={bundle}>
        <RelativeValuesRoot>
          <div data-testid="sort-only">
            <RelativeValuesSortMenu sections={["sort"]} sortOptions={[]} />
          </div>
          <RelativeValuesSingleView
            view="list"
            controls={{ sortMenu: { sortOptions: [] } }}
          />
        </RelativeValuesRoot>
      </RelativeValuesProvider>
    );
    expect(screen.getByTestId("sort-only").innerHTML).toBe("");
    fireEvent.click(screen.getByText("Table Settings"));
    expect(screen.queryByText("Sort by")).toBeNull();
    expect(screen.getAllByText("Clusters").length).toBeGreaterThan(0);
  });
});

describe("density", () => {
  test("a compact single view inside a comfortable root gets its own root", () => {
    const html = renderToStaticMarkup(
      <RelativeValuesProvider bundle={bundle}>
        <RelativeValuesRoot>
          <RelativeValuesSingleView
            view="grid"
            controls={false}
            display={{ density: "compact" }}
          />
          <RelativeValuesSingleView view="list" controls={false} />
        </RelativeValuesRoot>
      </RelativeValuesProvider>
    );
    expect(count(html, 'class="squiggle-rv squiggle-rv-compact"')).toBe(1);
    // The comfortable list renders in the enclosing root.
    expect(count(html, 'class="squiggle-rv"')).toBe(1);
  });
});

const count = (html: string, needle: string) => html.split(needle).length - 1;
