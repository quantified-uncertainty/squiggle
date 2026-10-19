import { FC, useEffect, useMemo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  InMemoryRelativeValuesCache,
  ModelEvaluator,
  type PairKey,
  type RelativeValueResult,
  RelativeValuesDashboard,
  RelativeValuesProvider,
  RelativeValuesRoot,
  RelativeValuesSearchBox,
  RelativeValuesSingleView,
  type RelativeValuesSpec,
} from "@quri/squiggle-relative-values";

import roadmapCode from "../../models/roadmap.squiggle?raw";
import { useSpec } from "../pages.js";
import { portfolioBundle } from "../portfolio.js";
import { Scenario, ScenarioPage } from "./Scenario.js";

// Counts how often each pair is stored, to check that two dashboards on one
// evaluator compute each pair once.
class CountingCache extends InMemoryRelativeValuesCache {
  readonly writes = new Map<PairKey, number>();
  override set(key: PairKey, result: RelativeValueResult) {
    this.writes.set(key, (this.writes.get(key) ?? 0) + 1);
    super.set(key, result);
  }
}

function useCountingEvaluator(spec: RelativeValuesSpec | undefined) {
  const cache = useMemo(() => new CountingCache(), []);
  const [evaluator, setEvaluator] = useState<ModelEvaluator>();
  useEffect(() => {
    if (!spec) return;
    ModelEvaluator.fromSpec(spec, { cache, modelCode: roadmapCode }).then(
      (result) => {
        if (result.ok) setEvaluator(result.value);
      }
    );
  }, [spec, cache]);
  return { cache, evaluator };
}

const WriteCounter: FC<{ cache: CountingCache }> = ({ cache }) => {
  const [, tick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => tick((t) => t + 1), 250);
    return () => clearInterval(interval);
  }, []);
  const counts = [...cache.writes.values()];
  const duplicates = counts.filter((count) => count > 1).length;
  return (
    <output
      data-host-writes={counts.length}
      data-host-duplicates={duplicates}
      className="acme-meta"
    >
      {counts.length} pairs computed, {duplicates} computed more than once
    </output>
  );
};

const SharedEvaluator: FC = () => {
  const spec = useSpec(roadmapCode);
  const { cache, evaluator } = useCountingEvaluator(
    spec?.ok ? spec.value : undefined
  );
  return (
    <Scenario
      id="S10"
      variant="evaluator"
      title="Two dashboards, one live evaluator"
      description={
        <>
          Both dashboards compute their pairs in the background on the same
          evaluator; the cache is checked before each pair, so no pair is
          computed twice. <WriteCounter cache={cache} />
        </>
      }
      code={`<RelativeValuesDashboard definition={definition} evaluator={evaluator} />
<RelativeValuesDashboard definition={definition} evaluator={evaluator} tabs={["grid"]} />`}
    >
      {spec?.ok && evaluator ? (
        <div className="acme-two-col">
          <RelativeValuesDashboard
            definition={spec.value.definition}
            evaluator={evaluator}
            tabs={["list", "plot"]}
            display={{ list: { itemIds: false } }}
            height={420}
          />
          <RelativeValuesDashboard
            definition={spec.value.definition}
            evaluator={evaluator}
            tabs={["grid"]}
            height={420}
          />
        </div>
      ) : (
        <p className="acme-meta">Running the model…</p>
      )}
    </Scenario>
  );
};

// Server rendering, here in the browser: the same markup a server component
// would send, with no window access.
const ServerMarkup: FC = () => {
  const markup = useMemo(
    () =>
      renderToStaticMarkup(
        <RelativeValuesSingleView
          bundle={portfolioBundle}
          view="list"
          controls={false}
        />
      ),
    []
  );
  const rows = markup.split('data-rv-part="list-row"').length - 1;
  return (
    <div data-host-content="">
      <p className="acme-meta" data-host-ssr-rows={rows}>
        renderToStaticMarkup: {markup.length.toLocaleString("en-US")}{" "}
        characters, {rows} list rows.
      </p>
      <div
        className="acme-ssr-preview"
        // Server markup, as a server component would send it.
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    </div>
  );
};

export const S10: FC = () => (
  <ScenarioPage
    id="s10"
    title="Several dashboards on a page; server rendering"
    intro="Dashboards share parsed bundles and evaluators; one provider can feed several views with one state; nothing touches window while rendering."
  >
    <Scenario
      id="S10"
      variant="bundle"
      title="Two views, one bundle object"
      description="One parse and one cache for both (bundles are memoized per object)."
      code={`<RelativeValuesSingleView bundle={bundle} view="list" scope={{ clusters: ["platform"] }} />
<RelativeValuesSingleView bundle={bundle} view="grid" scope={{ clusters: ["platform"] }} />`}
    >
      <div className="acme-two-col">
        <RelativeValuesSingleView
          bundle={portfolioBundle}
          view="list"
          scope={{ clusters: ["platform"] }}
          controls={{ list: { toolbar: false } }}
          display={{ list: { itemIds: false } }}
        />
        <RelativeValuesSingleView
          bundle={portfolioBundle}
          view="grid"
          scope={{ clusters: ["platform"] }}
          controls={false}
          display={{ grid: { cellWidth: 100 } }}
        />
      </div>
    </Scenario>
    <SharedEvaluator />
    <Scenario
      id="S10"
      variant="provider"
      title="One provider, two views, one state"
      description="The search box filters both the list and the plot."
      code={`<RelativeValuesProvider bundle={bundle}>
  <RelativeValuesRoot><RelativeValuesSearchBox /></RelativeValuesRoot>
  <RelativeValuesSingleView view="list" controls={{ list: { toolbar: false } }} />
  <RelativeValuesSingleView view="plot" />
</RelativeValuesProvider>`}
    >
      <RelativeValuesProvider bundle={portfolioBundle}>
        <RelativeValuesRoot className="acme-shared-search">
          <RelativeValuesSearchBox placeholder="Filter both views…" />
        </RelativeValuesRoot>
        <div className="acme-two-col" data-shared="">
          <RelativeValuesSingleView
            view="list"
            controls={{ list: { toolbar: false } }}
            display={{ list: { groupByCluster: false, itemIds: false } }}
          />
          <RelativeValuesSingleView
            view="plot"
            controls={{ plot: { clusterFilter: false } }}
            display={{ plot: { plots: ["similarity"], height: 300 } }}
          />
        </div>
      </RelativeValuesProvider>
    </Scenario>
    <Scenario
      id="S10"
      variant="ssr"
      title="Server-rendered markup"
      description="Rendered with react-dom/server's renderToStaticMarkup: bundle mode renders full markup on the first render."
      code={`renderToStaticMarkup(<RelativeValuesSingleView bundle={bundle} view="list" controls={false} />)`}
    >
      <ServerMarkup />
    </Scenario>
  </ScenarioPage>
);
