"use client";
import { FC, Fragment, useEffect, useState } from "react";

import { SquiggleViewer, useSimulator } from "@quri/squiggle-components";
import { result } from "@quri/squiggle-lang";
import { RefreshIcon } from "@quri/ui";

import { buildPairSquiggleCode } from "../../../lib/pairSquiggleCode.js";
import { Item } from "../../../types.js";
import { ModelEvaluator } from "../../../values/ModelEvaluator.js";
import {
  PAIR_CHARTS_SOURCE_ID,
  relativeValuesPairCharts,
} from "../../../values/pairCharts.js";
import { useCore } from "../../host/core.js";
import { FormattedNumber, uncertaintyNumber } from "../../host/format.js";
import { usePresentation } from "../../host/presentation.js";
import type {
  RelativeValuesNumberKind,
  RelativeValuesPairDetailsProps,
} from "../../host/types.js";
import { ItemName } from "../ItemName.js";

const TableRow: FC<{
  label: string;
  number: number;
  kind: RelativeValuesNumberKind;
  prefix?: string;
  suffix?: string;
}> = ({ label, number, kind, prefix, suffix }) => {
  const { format } = usePresentation();
  return (
    <Fragment key={label}>
      <div className="mt-1 min-w-0 break-words py-1 text-left text-xs font-normal text-[color:var(--squiggle-rv-muted,#64748b)]">
        {label}
      </div>
      <div className="min-w-0 py-1 text-left text-[color:var(--squiggle-rv-text,#475569)]">
        {prefix !== undefined && <span>{prefix} </span>}
        <FormattedNumber
          format={format}
          value={number}
          kind={kind}
          place="sidebar"
        />
        {suffix !== undefined && <span className="text-xs"> {suffix}</span>}
      </div>
    </Fragment>
  );
};

// Runs the pair's chart program (see `relativeValuesPairCharts`) and shows
// its result, a dict of the charts.
const PairChartsProgram: FC<{ code: string }> = ({ code }) => {
  const { simulation } = useSimulator({
    code,
    sourceId: PAIR_CHARTS_SOURCE_ID,
    setup: { type: "standalone" },
  });

  if (!simulation) {
    return <RefreshIcon className="animate-spin text-slate-400" />;
  }
  const result = simulation.output.result;
  if (!result.ok) {
    return (
      <div className="text-xs text-red-700" data-rv-chart-error="">
        Chart helper: {result.value.errors.map((e) => e.toString()).join("\n")}
      </div>
    );
  }
  return <SquiggleViewer value={result.value.result} />;
};

// The pair's charts, from the evaluator's own comparison function: the model
// isn't re-run, so models with numbers as values, with a trailing result
// expression or with imports all work.
const PairCharts: FC<{
  model: ModelEvaluator;
  numeratorItem: Item;
  denominatorItem: Item;
}> = ({ model, numeratorItem, denominatorItem }) => {
  const key = JSON.stringify([
    numeratorItem.id,
    numeratorItem.name,
    denominatorItem.id,
    denominatorItem.name,
  ]);
  const [charts, setCharts] = useState<{
    key: string;
    model: ModelEvaluator;
    code: result<string, string>;
  }>();

  useEffect(() => {
    let cancelled = false;
    relativeValuesPairCharts(model, numeratorItem, denominatorItem).then(
      (code) => {
        if (!cancelled) setCharts({ key, model, code });
      },
      (e: unknown) => {
        if (!cancelled) {
          setCharts({
            key,
            model,
            code: {
              ok: false,
              value: e instanceof Error ? e.message : String(e),
            },
          });
        }
      }
    );
    return () => {
      cancelled = true;
    };
    // `key` covers the items.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, key]);

  if (!charts || charts.key !== key || charts.model !== model) {
    return <RefreshIcon className="animate-spin text-slate-400" />;
  }
  if (!charts.code.ok) {
    return (
      <div className="text-xs text-red-700" data-rv-chart-error="">
        {charts.code.value}
      </div>
    );
  }
  return <PairChartsProgram code={charts.code.value} />;
};

// Closes the sidebar; focused when it opens as a drawer over the list.
const CloseButton: FC<{ close: () => void }> = ({ close }) => {
  const { labels } = usePresentation();
  return (
    <button
      type="button"
      aria-label={labels["sidebar.close"]}
      title={`${labels["sidebar.close"]} (Esc)`}
      data-rv-close=""
      className="absolute right-0 top-0 z-10 rounded px-1.5 text-lg leading-none text-[color:var(--squiggle-rv-muted,#64748b)] hover:bg-slate-200 hover:text-slate-800"
      onClick={close}
    >
      ×
    </button>
  );
};

// "value ( numerator / denominator )"
const PairHeading: FC<{ numerator: Item; denominator: Item }> = ({
  numerator,
  denominator,
}) => {
  const { labels } = usePresentation();
  return (
    <div className="mb-6 mt-2 flex items-center overflow-x-auto p-1 pr-6">
      <span className="mr-1 whitespace-nowrap text-[color:var(--squiggle-rv-muted,#64748b)]">
        {labels["sidebar.value"]}
      </span>
      <span className="whitespace-nowrap text-xl text-[color:var(--squiggle-rv-muted,#64748b)]">
        (
      </span>
      <span className="ml-2 mr-2 whitespace-pre-wrap rounded-sm bg-slate-200 bg-opacity-80 px-1 text-center text-sm font-semibold text-slate-900">
        <ItemName item={numerator} />
      </span>
      <span className="whitespace-nowrap px-1 text-xl text-[color:var(--squiggle-rv-muted,#64748b)]">
        /
      </span>

      <span className="ml-2 mr-2 whitespace-pre-wrap rounded-sm bg-slate-200 px-1 text-center text-sm font-semibold text-slate-900">
        <span className="inline-block">
          <ItemName item={denominator} />
        </span>
      </span>
      <span className="whitespace-nowrap text-xl text-[color:var(--squiggle-rv-muted,#64748b)]">
        )
      </span>
    </div>
  );
};

/** The built-in pair details (the `Default` of the `PairDetails` slot). */
export const DefaultPairDetails: FC<RelativeValuesPairDetailsProps> = ({
  numerator: numeratorItem,
  denominator: denominatorItem,
  result,
  close,
}) => {
  const { options, labels, format } = usePresentation();
  const { getPlaygroundUrl } = options;
  const core = useCore();
  const evaluator = core.snapshot?.evaluator;
  // A locked pair can't be closed (Esc and cell clicks are ignored too).
  const closeButton = core.isLocked("selectedPair") ? null : (
    <CloseButton close={close} />
  );
  if (!result.ok || !evaluator) {
    // A failed comparison: what went wrong, as in its cell.
    return (
      <div className="relative">
        {closeButton}
        <PairHeading numerator={numeratorItem} denominator={denominatorItem} />
        <div className="text-sm text-[color:var(--squiggle-rv-text,#475569)]">
          {labels["sidebar.notFound"]}
        </div>
        {!result.ok && (
          <div
            className="mt-2 whitespace-pre-wrap break-words text-xs text-red-700"
            data-rv-pair-error=""
          >
            {result.value}
          </div>
        )}
      </div>
    );
  }
  const item = result.value;
  const squiggleCode =
    evaluator.modelCode !== undefined && evaluator.fnExpression !== undefined
      ? buildPairSquiggleCode({
          modelCode: evaluator.modelCode,
          fnExpression: evaluator.fnExpression,
          numeratorItem,
          denominatorItem,
        })
      : undefined;

  return (
    <div className="relative">
      {closeButton}
      <PairHeading numerator={numeratorItem} denominator={denominatorItem} />

      <div className="xs mb-4 text-[color:var(--squiggle-rv-muted,#64748b)]">
        {labels["sidebar.summary"](
          <span className="font-semibold text-[color:var(--squiggle-rv-text,#334155)]">
            {numeratorItem.name}
          </span>,
          <span className="font-semibold text-[color:var(--squiggle-rv-text,#334155)]">
            {denominatorItem.name}
          </span>
        )}
      </div>

      {evaluator.canCompute ? (
        <PairCharts
          model={evaluator}
          numeratorItem={numeratorItem}
          denominatorItem={denominatorItem}
        />
      ) : (
        // Precomputed values (e.g. a bundle) don't include distributions.
        <div className="text-xs text-[color:var(--squiggle-rv-muted,#64748b)]">
          {labels["sidebar.noCharts"]}
        </div>
      )}

      {/* Label, value, label, value: label columns fit their (translated)
          labels. */}
      <div className="mb-10 mt-10 grid w-full grid-cols-[auto_1fr_auto_1fr] gap-x-2 gap-y-1">
        <TableRow
          label={labels["sidebar.median"]}
          number={item.median}
          kind="median"
        />
        <TableRow
          label={labels["sidebar.mean"]}
          number={item.mean}
          kind="mean"
        />
        <TableRow label={labels["sidebar.p5"]} number={item.min} kind="p5" />
        <TableRow label={labels["sidebar.p95"]} number={item.max} kind="p95" />
        {format.uncertainty !== "hidden" && (
          // As in the cells: half the 90% interval, in orders of magnitude,
          // or as a factor.
          <TableRow
            label={labels["sidebar.uncertainty"]}
            number={uncertaintyNumber(format, item)}
            kind="uncertainty"
            prefix={format.uncertainty === "factor" ? "×/÷" : "±"}
            suffix={
              format.uncertainty === "om"
                ? labels["cell.uncertaintyUnit"]
                : undefined
            }
          />
        )}
      </div>

      {squiggleCode !== undefined && getPlaygroundUrl && (
        <a
          href={getPlaygroundUrl(squiggleCode)}
          className="text-[color:var(--squiggle-rv-muted,#64748b)] underline"
          target="_blank"
          rel="noreferrer"
        >
          {labels["sidebar.openInPlayground"]}
        </a>
      )}
    </div>
  );
};
