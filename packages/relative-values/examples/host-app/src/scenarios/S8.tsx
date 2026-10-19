import { FC } from "react";

import {
  RelativeValuesProgressBar,
  RelativeValuesProvider,
  RelativeValuesRoot,
  useRelativeValues,
} from "@quri/squiggle-relative-values";

import largeCatalogCode from "../../models/large-catalog.squiggle?raw";
import { useSpec } from "../pages.js";
import { portfolioBundle } from "../portfolio.js";
import { Scenario, ScenarioPage } from "./Scenario.js";

// A fully custom view: the host's own markup, from headless data.
const TopInitiatives: FC<{ count: number }> = ({ count }) => {
  const rv = useRelativeValues({
    requires: "unit",
    overrides: { sort: { mode: "median", desc: true }, limit: count },
  });
  if (rv.status === "loading") {
    return <p className="acme-meta">Loading the model…</p>;
  }
  if (rv.status === "error") {
    return <p className="acme-alert">{rv.error}</p>;
  }
  return (
    <ol
      className="acme-top"
      aria-busy={rv.status === "computing"}
      data-host-top=""
      data-status={rv.status}
    >
      {rv.rows.map(({ item, value }) => (
        <li key={item.id} data-median={value?.median}>
          <strong>{item.name}</strong>{" "}
          <span className="acme-meta">
            {value ? rv.format.value(value) : "…"} × {rv.unit?.name}{" "}
            {value ? `(${rv.format.uncertainty(value)})` : ""}
          </span>
        </li>
      ))}
    </ol>
  );
};

// A custom plot: value bars with 90% intervals, on a log scale.
const IntervalChart: FC = () => {
  const rv = useRelativeValues({ requires: "unit" });
  if (rv.status !== "ready") {
    return null;
  }
  const rows = rv.rows.flatMap((row) =>
    row.value ? [{ ...row, value: row.value }] : []
  );
  const log = (x: number) => Math.log10(Math.max(x, 1e-6));
  const min = Math.min(...rows.map((row) => log(row.value.min)));
  const max = Math.max(...rows.map((row) => log(row.value.max)));
  const x = (v: number) => 180 + ((log(v) - min) / (max - min || 1)) * 520;
  const rowHeight = 22;
  return (
    <svg
      className="acme-interval-chart"
      data-host-content=""
      width={720}
      height={rows.length * rowHeight + 24}
      role="img"
      aria-label={`Value in units of ${rv.unit?.name}`}
    >
      {rows.map((row, i) => {
        const y = i * rowHeight + 14;
        return (
          <g key={row.item.id}>
            <text x={170} y={y + 4} textAnchor="end" fontSize={12}>
              {row.item.name}
            </text>
            <line
              x1={x(row.value.min)}
              x2={x(row.value.max)}
              y1={y}
              y2={y}
              stroke={row.cluster?.color ?? "#999"}
              strokeWidth={4}
              strokeLinecap="round"
            />
            <circle cx={x(row.value.median)} cy={y} r={5} fill="#1f2a37" />
          </g>
        );
      })}
      <line
        x1={x(1)}
        x2={x(1)}
        y1={0}
        y2={rows.length * rowHeight + 8}
        stroke="#b4232c"
        strokeDasharray="3 3"
      />
      <text
        x={x(1)}
        y={rows.length * rowHeight + 22}
        textAnchor="middle"
        fontSize={11}
      >
        1 × {rv.unit?.name}
      </text>
    </svg>
  );
};

const LiveTop: FC = () => {
  const spec = useSpec(largeCatalogCode);
  if (!spec) {
    return <p className="acme-meta">Running the model…</p>;
  }
  if (!spec.ok) {
    return <p className="acme-alert">{spec.value}</p>;
  }
  return (
    <RelativeValuesProvider
      spec={spec.value}
      modelCode={largeCatalogCode}
      precompute
    >
      <TopInitiatives count={5} />
      <RelativeValuesRoot>
        <RelativeValuesProgressBar variant="compact" />
      </RelativeValuesRoot>
    </RelativeValuesProvider>
  );
};

export const S8: FC = () => (
  <ScenarioPage
    id="s8"
    title="Custom views from headless data"
    intro="`useRelativeValues()` returns the filtered, sorted rows with their values, the unit, the status and formatting helpers, in bundle and live mode, without rendering any built-in view."
  >
    <Scenario
      id="S8"
      variant="top5"
      title="Top 5, in the host's markup (bundle)"
      code={`const TopInitiatives = ({ count }) => {
  const rv = useRelativeValues({ requires: "unit",
    overrides: { sort: { mode: "median", desc: true }, limit: count } });
  if (rv.status === "loading") return <Spinner />;
  return <ol>{rv.rows.map(({ item, value }) =>
    <li key={item.id}>{item.name}: {value ? rv.format.value(value) : "…"} × {rv.unit?.name}</li>)}</ol>;
};
<RelativeValuesProvider bundle={bundle} defaultState={{ unit: "sso" }}><TopInitiatives count={5} /></RelativeValuesProvider>`}
    >
      <RelativeValuesProvider
        bundle={portfolioBundle}
        defaultState={{ unit: "sso" }}
      >
        <TopInitiatives count={5} />
      </RelativeValuesProvider>
    </Scenario>
    <Scenario
      id="S8"
      variant="live"
      title="Top 5 of 120 items, computed in the browser"
      description="Live mode: the top 5 need only the 120 item × unit pairs; the other 14,280 pairs compute in the background (the progress bar)."
      code={`<RelativeValuesProvider spec={spec} modelCode={code} precompute>
  <TopInitiatives count={5} />
  <RelativeValuesRoot><RelativeValuesProgressBar variant="compact" /></RelativeValuesRoot>
</RelativeValuesProvider>`}
    >
      <LiveTop />
    </Scenario>
    <Scenario
      id="S8"
      variant="chart"
      title="A custom chart"
      description="Medians and 90% intervals in units of the recommended unit, drawn by the host (SVG)."
      code={`const rv = useRelativeValues({ requires: "unit" });
rv.rows.map((row) => <line x1={x(row.value.min)} x2={x(row.value.max)} … />)`}
    >
      <RelativeValuesProvider
        bundle={portfolioBundle}
        defaultState={{ sort: { mode: "median", desc: true } }}
      >
        <IntervalChart />
      </RelativeValuesProvider>
    </Scenario>
  </ScenarioPage>
);
