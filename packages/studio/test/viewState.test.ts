import { describe, expect, test } from "vitest";

import {
  initialStateFor,
  urlFlagsFromSearch,
  type ViewState,
  viewStateFromSearch,
  viewStateToSearch,
} from "../src/shared/viewState.js";

describe("viewState", () => {
  test("round trip", () => {
    const states: ViewState[] = [
      {},
      { file: "main.squiggle" },
      {
        file: "models/fruit.squiggle",
        view: "relative-values",
        tab: "grid",
        variable: "fruit",
      },
      {
        file: "a b/ü.squiggle",
        view: "output",
        layout: "list",
        code: false,
        line: 12,
      },
      { file: "x.squiggle", code: true },
    ];
    for (const state of states) {
      expect(viewStateFromSearch(viewStateToSearch(state))).toEqual(state);
    }
  });

  test("encodes paths and uses a stable parameter order", () => {
    expect(
      viewStateToSearch({
        view: "output",
        file: "lib/costs.squiggle",
        code: true,
      })
    ).toBe("?file=lib%2Fcosts.squiggle&view=output&code=1");
    expect(viewStateToSearch({})).toBe("");
  });

  test("keeps URL flags after the view", () => {
    expect(
      viewStateToSearch({ file: "a.squiggle" }, { test: "1", menubar: "1" })
    ).toBe("?file=a.squiggle&test=1&menubar=1");
    expect(urlFlagsFromSearch("?file=a&embed=1&test=1")).toEqual({
      embed: "1",
      test: "1",
    });
  });

  test("invalid values are dropped, not thrown", () => {
    expect(
      viewStateFromSearch(
        "?file=&view=output&tab=table&layout=grid&code=yes&line=-3&variable=x"
      )
    ).toEqual({ view: "output", variable: "x" });
    expect(viewStateFromSearch("?line=7.5")).toEqual({});
    expect(viewStateFromSearch("")).toEqual({});
  });

  test("the URL's initial state applies to the ?file= file only (#17)", () => {
    const initial = viewStateFromSearch(
      "?file=a.squiggle&view=output&variable=x"
    );
    expect(initialStateFor("a.squiggle", initial)).toEqual(initial);
    expect(initialStateFor("b.squiggle", initial)).toBeUndefined();
    expect(initialStateFor("a.squiggle", {})).toBeUndefined();
    expect(initialStateFor("a.squiggle", undefined)).toBeUndefined();
  });
});
