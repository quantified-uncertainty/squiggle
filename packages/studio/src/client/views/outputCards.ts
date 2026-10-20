// Which cards the Output view shows (pure, so it is unit-tested without a
// browser).
//
// Cards are keyed by binding name (`result` for the final expression), never
// by run: a rerun updates each card in place, so calculator inputs, expanded
// plots and expanded items survive an agent's edit (#22).

import {
  defaultEnvironment,
  type Env,
  SqDateRangeDomain,
  SqNumericRangeDomain,
  type SqValue,
  type SqValuePath,
} from "@quri/squiggle-lang";

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

// The x range the viewer plots a function over when its parameter has no
// range of its own (components' functionChartDefaults).
const PLOT_X_RANGE = { min: 0, max: 10 };

// "Show plot" only for functions the viewer can plot (#26): one parameter,
// and a call at either end of the plotted range returns a number or a
// distribution, as the viewer's own first two calls must. A function of a
// distribution (`scaleDist(d) = SampleSet.fromDist(d) * 2`) fails both calls,
// and one that returns a record has no chart, so neither is offered.
export function isPlottableFunction(
  value: SqValue,
  environment: Env = defaultEnvironment
): boolean {
  if (value.tag !== "Lambda") return false;
  const fn = value.value;
  if (!fn.parameterCounts().includes(1)) return false;
  const domain = fn.signatures().find((s) => s.length === 1)?.[0]?.domain;
  const range =
    domain instanceof SqNumericRangeDomain ||
    domain instanceof SqDateRangeDomain
      ? domain
      : SqNumericRangeDomain.fromMinMax(PLOT_X_RANGE.min, PLOT_X_RANGE.max);
  for (const x of [range.minValue, range.maxValue]) {
    const result = fn.call([x], environment);
    if (result.ok) {
      return result.value.tag === "Number" || result.value.tag === "Dist";
    }
  }
  return false;
}

// The card that shows a value path: its binding, or the result card.
export function cardKeyForPath(path: SqValuePath): string | undefined {
  if (path.root === "result") return RESULT_CARD_KEY;
  if (path.root !== "bindings") return undefined;
  const first = path.edges[0]?.value;
  return first?.type === "key" ? first.value : undefined;
}
