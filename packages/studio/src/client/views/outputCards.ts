// Which cards the Output view shows (pure, so it is unit-tested without a
// browser).
//
// Cards are keyed by binding name (`result` for the final expression), never
// by run: a rerun updates each card in place, so calculator inputs, expanded
// plots and expanded items survive an agent's edit (#22).

import type { SqValue, SqValuePath } from "@quri/squiggle-lang";

export const RESULT_CARD_KEY = "result";

export type OutputCard =
  | { kind: "result"; key: typeof RESULT_CARD_KEY; value: SqValue }
  | { kind: "value"; key: string; name: string; value: SqValue }
  | { kind: "function"; key: string; name: string; value: SqValue };

export type OutputCardsPlan = {
  cards: OutputCard[];
  // Shown instead of cards when there are none.
  message?: string;
};

export function planOutputCards(opts: {
  bindings: ReadonlyArray<readonly [string, SqValue]>;
  result: SqValue;
  // Embed mode (`render`): functions get a full card, since a PNG can't
  // expand one.
  embed: boolean;
}): OutputCardsPlan {
  const { bindings, result, embed } = opts;
  const cards: OutputCard[] = [];
  if (result.tag !== "Void") {
    cards.push({ kind: "result", key: RESULT_CARD_KEY, value: result });
  }
  const visible = bindings.filter(([, value]) => !value.tags.hidden());
  for (const [name, value] of visible) {
    cards.push({
      kind: value.tag === "Lambda" && !embed ? "function" : "value",
      key: name,
      name,
      value,
    });
  }
  if (cards.length > 0) return { cards };
  if (bindings.length > 0) {
    const n = bindings.length;
    return {
      cards,
      message:
        n === 1
          ? "The only variable is hidden with @hide."
          : `All ${n} variables are hidden with @hide.`,
    };
  }
  return { cards, message: "This model doesn't define any variables yet." };
}

// "fn(principal, rate, years)" from a lambda's parameterString() ("a,b").
export function functionSignature(parameterString: string): string {
  const params = parameterString
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return `fn(${params.join(", ")})`;
}

// Only one-parameter functions can be plotted ("Show plot").
export function isPlottableFunction(value: SqValue): boolean {
  if (value.tag !== "Lambda") return false;
  return value.value.parameterCounts().includes(1);
}

// The card that shows a value path: its binding, or the result card.
export function cardKeyForPath(path: SqValuePath): string | undefined {
  if (path.root === "result") return RESULT_CARD_KEY;
  if (path.root !== "bindings") return undefined;
  const first = path.edges[0]?.value;
  return first?.type === "key" ? first.value : undefined;
}
