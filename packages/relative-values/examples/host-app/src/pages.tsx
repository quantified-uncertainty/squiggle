import { FC, useEffect, useState } from "react";

import { run } from "@quri/squiggle-lang";
import {
  findRelativeValuesExports,
  type Item,
  RelativeValuesBundleDashboard,
  type RelativeValuesExport,
  RelativeValuesSpecDashboard,
} from "@quri/squiggle-relative-values";

import largeCatalogCode from "../models/large-catalog.squiggle?raw";
import roadmapCode from "../models/roadmap.squiggle?raw";
import { portfolioBundle, portfolioEvaluator } from "./portfolio.js";
import { RankingTab } from "./RankingTab.js";

// Host UI outside of the dashboards, styled only by host.css.
const SampleControls: FC = () => (
  <aside className="acme-panel" data-host-sample="">
    <h2>Quick actions</h2>
    <p>
      <button type="button">Request review</button>
    </p>
    <p>
      <input type="search" placeholder="Search the portal" />
    </p>
    <ul>
      <li>
        <a href="#/bundle">Q3 portfolio</a>
      </li>
      <li>Planning deadline: Friday</li>
    </ul>
  </aside>
);

// Runs Squiggle code in the browser and returns the first relative values
// spec in it.
function useSpec(code: string): RelativeValuesExport["spec"] | undefined {
  const [found, setFound] = useState<RelativeValuesExport[] | undefined>();
  useEffect(() => {
    run(code).then((output) => setFound(findRelativeValuesExports(output)));
  }, [code]);
  return found?.[0]?.spec;
}

export const LivePage: FC = () => {
  const spec = useSpec(roadmapCode);
  const [selected, setSelected] = useState<Item | undefined>();

  return (
    <>
      <div className="acme-intro">
        <div>
          <h1>Roadmap bets</h1>
          <p>
            Product proposals for the next two quarters, compared pairwise. This
            dashboard runs the Squiggle model in your browser; edit{" "}
            <code>models/roadmap.squiggle</code> and the page reloads.
          </p>
          <p className="acme-meta">Click an item name to select it.</p>
        </div>
        <SampleControls />
      </div>
      <div className="acme-card">
        {!spec ? (
          <p>Running the model…</p>
        ) : !spec.ok ? (
          <p>Invalid spec: {spec.value}</p>
        ) : (
          <RelativeValuesSpecDashboard
            spec={spec.value}
            // Enables per-pair distribution charts in the list sidebar.
            modelCode={roadmapCode}
            onItemClick={setSelected}
          />
        )}
      </div>
      {selected && (
        <div className="acme-panel acme-selected" data-selected-item="">
          Selected: <strong>{selected.name}</strong>{" "}
          <button type="button" onClick={() => setSelected(undefined)}>
            Clear
          </button>
        </div>
      )}
    </>
  );
};

const clusterColors = {
  enterprise: { color: "#0b3d91" },
  retention: { color: "#b4232c" },
  platform: { color: "#2f855a" },
  research: { color: "#b7791f", name: "Research & data" },
};

export const BundlePage: FC = () => {
  const { meta } = portfolioBundle;
  return (
    <>
      <h1>Q3 initiative portfolio</h1>
      <p>
        Precomputed with the <code>squiggle-rv bundle</code> CLI: this page
        doesn&apos;t run any Squiggle code.
      </p>
      <p className="acme-meta" data-bundle-meta="">
        Generated {new Date(meta.generatedAt).toLocaleDateString("en-US")} from{" "}
        <code>{meta.variableName}</code> · {meta.sampleCount} samples · seed “
        {meta.seed}” · {meta.sourceHash?.slice(0, 15)}…
      </p>
      <div className="acme-card">
        <RelativeValuesBundleDashboard
          bundle={portfolioBundle}
          height={640}
          tabs={[
            "list",
            {
              id: "ranking",
              label: "Ranking",
              render: (context) => <RankingTab context={context} />,
            },
            "grid",
            "plot",
          ]}
          clusterOverrides={clusterColors}
          // Element rules like `a { ... }` don't apply inside the
          // dashboard; style your content with classes.
          renderItemName={(item) => (
            <a className="acme-link" href={`#/initiative/${item.id}`}>
              {item.name}
            </a>
          )}
          onTabChange={(tab) => console.log("tab", tab)}
        />
      </div>
    </>
  );
};

const format = new Intl.NumberFormat("en-US", { maximumSignificantDigits: 2 });

// Uses the bundle directly, without a dashboard.
export const InitiativePage: FC<{ id: string }> = ({ id }) => {
  const { items, clusters } = portfolioBundle.definition;
  const item = items.find((i) => i.id === id);
  if (!item) {
    return <h1>Unknown initiative</h1>;
  }
  const cluster = clusters.find((c) => c.id === item.clusterId);
  const others = items.filter((other) => other.id !== id);
  return (
    <>
      <h1>{item.name}</h1>
      <p className="acme-meta">{cluster?.name ?? "No cluster"}</p>
      <h2>Worth how many…</h2>
      <table>
        <tbody>
          {others.map((other) => {
            const result = portfolioEvaluator.compare(id, other.id);
            return (
              <tr key={other.id}>
                <td>
                  <a href={`#/initiative/${other.id}`}>{other.name}</a>
                </td>
                <td>{result.ok ? format.format(result.value.median) : "–"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p>
        <a href="#/bundle">Back to the portfolio</a>
      </p>
    </>
  );
};

export const LargeCatalogPage: FC = () => {
  const spec = useSpec(largeCatalogCode);
  // `?sync` turns off asynchronous computation, for comparison.
  const sync = new URLSearchParams(window.location.search).has("sync");
  return (
    <>
      <h1>Large catalog</h1>
      <p>
        120 items, 14,400 pairs, computed in the browser without freezing the
        page.
      </p>
      <div className="acme-card">
        {!spec ? (
          <p>Running the model…</p>
        ) : !spec.ok ? (
          <p>Invalid spec: {spec.value}</p>
        ) : (
          <RelativeValuesSpecDashboard
            spec={spec.value}
            height={600}
            precompute={!sync}
          />
        )}
      </div>
    </>
  );
};
