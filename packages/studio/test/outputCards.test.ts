import { describe, expect, test } from "vitest";

import {
  run,
  SqValuePath,
  SqValuePathEdge,
  type SqValue,
} from "@quri/squiggle-lang";

import {
  cardKeyForPath,
  functionSignature,
  isPlottableFunction,
  planOutputCards,
  RESULT_CARD_KEY,
} from "../src/client/views/outputCards.js";

// The Output view's cards (#22, #26, #54).

async function outputOf(code: string) {
  const output = await run(code);
  if (!output.result.ok) throw new Error(output.result.value.toString());
  return output.result.value;
}

async function plan(code: string, embed = false) {
  const { bindings, result } = await outputOf(code);
  return planOutputCards({ bindings: bindings.entries(), result, embed });
}

async function valueOf(code: string, name: string): Promise<SqValue> {
  const { bindings } = await outputOf(code);
  const value = bindings.get(name);
  if (!value) throw new Error(`no ${name}`);
  return value;
}

describe("planOutputCards", () => {
  test("cards are keyed by binding name, the result card by 'result'", async () => {
    const { cards, message } = await plan(
      "a = 1\nb = 2 to 3\nf(x) = x * 2\na + b"
    );
    expect(message).toBeUndefined();
    expect(cards.map((c) => [c.kind, c.key])).toEqual([
      ["result", RESULT_CARD_KEY],
      ["value", "a"],
      ["value", "b"],
      ["function", "f"],
    ]);
  });

  test("keys don't change between runs", async () => {
    const first = await plan("a = 1\nb = 2");
    const second = await plan("// a comment\na = 1\nb = 3");
    expect(second.cards.map((c) => c.key)).toEqual(
      first.cards.map((c) => c.key)
    );
  });

  test("hidden bindings get no card", async () => {
    const { cards } = await plan("@hide\nhelper = 3\nshown = helper * 2");
    expect(cards.map((c) => c.key)).toEqual(["shown"]);
  });

  test("functions get a full card in embed mode", async () => {
    const { cards } = await plan("f(x) = x", true);
    expect(cards.map((c) => c.kind)).toEqual(["value"]);
  });

  test("all variables hidden: says so instead of 'no variables' (#54)", async () => {
    expect((await plan("@hide\na = 1\n@hide\nb = 2")).message).toBe(
      "All 2 variables are hidden with @hide."
    );
    expect((await plan("@hide\na = 1")).message).toBe(
      "The only variable is hidden with @hide."
    );
  });

  test("an empty model", async () => {
    const { cards, message } = await plan("");
    expect(cards).toEqual([]);
    expect(message).toBe("This model doesn't define any variables yet.");
  });

  test("a model with only a result has one card", async () => {
    const { cards, message } = await plan("2 to 3");
    expect(cards.map((c) => c.key)).toEqual([RESULT_CARD_KEY]);
    expect(message).toBeUndefined();
  });
});

describe("functionSignature (#26)", () => {
  test("fn(…) from the parameter string", () => {
    expect(functionSignature("x")).toBe("fn(x)");
    expect(functionSignature("principal,rate,years")).toBe(
      "fn(principal, rate, years)"
    );
    expect(functionSignature("")).toBe("fn()");
  });

  test("from real lambdas", async () => {
    const code = "@doc('d')\ngrowth(principal, rate, years) = principal * rate";
    const value = await valueOf(code, "growth");
    expect(value.tag).toBe("Lambda");
    if (value.tag !== "Lambda") return;
    expect(functionSignature(value.value.parameterString())).toBe(
      "fn(principal, rate, years)"
    );
  });
});

describe("isPlottableFunction (#26)", () => {
  test("only one-parameter functions", async () => {
    const code = "one(x) = x\ntwo(a, b) = a + b\nnone() = 1\nn = 3";
    expect(isPlottableFunction(await valueOf(code, "one"))).toBe(true);
    expect(isPlottableFunction(await valueOf(code, "two"))).toBe(false);
    expect(isPlottableFunction(await valueOf(code, "none"))).toBe(false);
    expect(isPlottableFunction(await valueOf(code, "n"))).toBe(false);
  });

  test("only functions the viewer can chart: numbers or distributions over its x range", async () => {
    const code = [
      "dist(x) = normal(x, 1)",
      "ranged(x: [1, 10]) = x ^ 2",
      "positive(x) = x > 0 ? x : throw('needs x > 0')",
      "scaleDist(d) = SampleSet.fromDist(d) * 2",
      "pair(x) = {a: x, b: x * 2}",
    ].join("\n");
    expect(isPlottableFunction(await valueOf(code, "dist"))).toBe(true);
    expect(isPlottableFunction(await valueOf(code, "ranged"))).toBe(true);
    // Fails at 0, works at 10: the viewer plots it.
    expect(isPlottableFunction(await valueOf(code, "positive"))).toBe(true);
    // Takes a distribution: every call with a number fails.
    expect(isPlottableFunction(await valueOf(code, "scaleDist"))).toBe(false);
    // Returns a record: the viewer has no chart for it.
    expect(isPlottableFunction(await valueOf(code, "pair"))).toBe(false);
  });
});

describe("cardKeyForPath", () => {
  test("a binding's card, nested paths included; the result card", () => {
    const key = (name: string) => SqValuePathEdge.fromKey(name);
    expect(
      cardKeyForPath(new SqValuePath({ root: "bindings", edges: [key("a")] }))
    ).toBe("a");
    expect(
      cardKeyForPath(
        new SqValuePath({
          root: "bindings",
          edges: [key("cfg"), key("rate")],
        })
      )
    ).toBe("cfg");
    expect(cardKeyForPath(new SqValuePath({ root: "result", edges: [] }))).toBe(
      RESULT_CARD_KEY
    );
    expect(
      cardKeyForPath(new SqValuePath({ root: "imports", edges: [key("x")] }))
    ).toBeUndefined();
  });
});
