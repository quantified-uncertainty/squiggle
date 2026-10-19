"use client";
import clsx from "clsx";
import { FC, useMemo } from "react";

import { useCore } from "../host/core.js";
import { usePresentation } from "../host/presentation.js";
import type { ConsumerRequirement } from "../host/requirements.js";
import { renderSlot } from "../host/slots.js";
import { useRelativeValuesConsumer } from "../useRelativeValues.js";
import { DefaultPairDetails } from "../views/ListView/sidebar.js";

const noPair: ConsumerRequirement = { kind: "pairs", pairs: [] };

/**
 * Details of a pair: summary numbers, and (in live mode) distribution charts.
 * Defaults to `state.selectedPair`; renders nothing without a pair. Goes
 * through the `PairDetails` slot.
 */
export const RelativeValuesPairDetails: FC<{
  className?: string;
  pair?: readonly [string, string];
}> = ({ className, pair: givenPair }) => {
  const core = useCore();
  const { labels } = usePresentation();
  const pair = givenPair ?? core.state.selectedPair;
  const pairKey = pair ? `${pair[0]}\0${pair[1]}` : "";
  const requirement = useMemo(
    (): ConsumerRequirement =>
      pair ? { kind: "pairs", pairs: [pair] } : noPair,
    // Identified by the ids.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pairKey]
  );
  const rv = useRelativeValuesConsumer(requirement);
  const { components } = usePresentation();

  if (!pair || rv.status === "loading" || rv.status === "error") {
    return null;
  }
  const byId = new Map(rv.definition.items.map((item) => [item.id, item]));
  const numerator = byId.get(pair[0]);
  const denominator = byId.get(pair[1]);
  if (!numerator || !denominator) {
    return null;
  }
  const result = rv.compare(pair[0], pair[1]);
  return (
    <div
      className={className}
      data-rv-part="sidebar"
      data-rv-provider={core.id}
      data-rv-pair-numerator={numerator.id}
      data-rv-pair-denominator={denominator.id}
    >
      {result ? (
        renderSlot(components.PairDetails, DefaultPairDetails, {
          numerator,
          denominator,
          result,
          close: () =>
            core.dispatch({ type: "selectPair", pair: null }, "user"),
        })
      ) : (
        <div className={clsx("text-sm text-slate-400")}>
          {labels["progress.computingShort"]}
        </div>
      )}
    </div>
  );
};
