import { FC, useMemo, useRef, useState } from "react";

import {
  parseRelativeValuesState,
  pickRelativeValuesState,
  RelativeValuesBundleDashboard,
  type RelativeValuesHandle,
  RelativeValuesProvider,
  RelativeValuesSingleView,
  type RelativeValuesState,
  type RelativeValuesStateInput,
  relativeValuesStateFromSearchParams,
  type RelativeValuesStateKey,
  relativeValuesStateToSearchParams,
  useRelativeValues,
} from "@quri/squiggle-relative-values";

import { portfolioBundle } from "../portfolio.js";
import { useHashQuery } from "../useHashRoute.js";
import { Scenario, ScenarioPage } from "./Scenario.js";

const URL_KEYS: RelativeValuesStateKey[] = [
  "view",
  "unit",
  "clusters",
  "search",
  "sort",
  "limit",
  "gridMode",
  "selectedPair",
];

const UrlSynced: FC = () => {
  const [params, setParams] = useHashQuery();
  const state = useMemo(
    () => relativeValuesStateFromSearchParams(params, { keys: URL_KEYS }),
    [params]
  );
  const api = useRef<RelativeValuesHandle>(null);
  const [events, setEvents] = useState<string[]>([]);
  const log = (event: string) =>
    setEvents((previous) => [event, ...previous].slice(0, 4));

  return (
    <Scenario
      id="S5"
      variant="url"
      title="State in the URL"
      description={
        <>
          Every setting in {URL_KEYS.length} keys lives in this page&apos;s URL
          (try a sort, then Back). Search and selection replace the history
          entry instead of adding one. Query:{" "}
          <code data-host-query="">{params.toString() || "(none)"}</code>
        </>
      }
      controls={
        <>
          <button
            type="button"
            data-host-compare=""
            onClick={() =>
              api.current?.setState({
                view: "list",
                selectedPair: ["sso", "auditLog"],
              })
            }
          >
            Compare SSO and audit log
          </button>{" "}
          <button
            type="button"
            onClick={() =>
              api.current?.setState({
                view: "grid",
                sort: { mode: "median", desc: true },
                limit: 5,
              })
            }
          >
            Top 5 grid
          </button>{" "}
          <button type="button" onClick={() => api.current?.reset()}>
            Reset
          </button>
          <ul className="acme-events" data-host-events="">
            {events.map((event, i) => (
              <li key={i}>{event}</li>
            ))}
          </ul>
        </>
      }
      code={`const [params, setParams] = useSearchParams(); // any router
const state = useMemo(() => relativeValuesStateFromSearchParams(params, { keys: URL_KEYS }), [params]);
<RelativeValuesBundleDashboard bundle={bundle} apiRef={api} state={state}
  onStateChange={(next, change) => setParams(
    relativeValuesStateToSearchParams(next, { keys: URL_KEYS, base: params }),
    { replace: change.reason === "search" || change.reason === "selection" })}
  onItemClick={(item) => …} onPairClick={({ numerator, denominator }) => …} />`}
    >
      <RelativeValuesBundleDashboard
        bundle={portfolioBundle}
        apiRef={api}
        state={state}
        onStateChange={(next, change) => {
          log(`${change.source}: ${change.reason} (${change.keys.join(", ")})`);
          setParams(
            relativeValuesStateToSearchParams(next, {
              keys: URL_KEYS,
              base: params,
            }),
            {
              replace:
                change.reason === "search" || change.reason === "selection",
            }
          );
        }}
        onItemClick={(item) => log(`item click: ${item.id}`)}
        onPairClick={({ numerator, denominator }) =>
          log(`pair click: ${numerator.id} / ${denominator.id}`)
        }
        height={520}
      />
    </Scenario>
  );
};

const STORAGE_KEY = "acme:rv-preferences";
const PREFERENCE_KEYS: RelativeValuesStateKey[] = [
  "view",
  "unit",
  "sort",
  "gridMode",
];

function readPreferences(): RelativeValuesStateInput {
  try {
    return parseRelativeValuesState(
      JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")
    ).state;
  } catch {
    return {};
  }
}

const Preferences: FC = () => {
  // Remounts with fresh defaults after a reset.
  const [generation, setGeneration] = useState(0);
  const saved = useMemo(() => readPreferences(), [generation]);
  return (
    <Scenario
      id="S5"
      variant="preferences"
      title="Preferences in localStorage"
      description={
        <>
          Uncontrolled, with saved defaults: the view, unit, sort and grid mode
          survive a reload. Saved:{" "}
          <code data-host-saved="">{JSON.stringify(saved)}</code>
        </>
      }
      controls={
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            setGeneration((g) => g + 1);
          }}
        >
          Forget preferences
        </button>
      }
      code={`const saved = parseRelativeValuesState(JSON.parse(localStorage.getItem(key) ?? "null")).state;
<RelativeValuesBundleDashboard bundle={bundle} defaultState={saved}
  onStateChange={(next) => localStorage.setItem(key,
    JSON.stringify(pickRelativeValuesState(next, ["view", "unit", "sort", "gridMode"])))} />`}
    >
      <RelativeValuesBundleDashboard
        key={generation}
        bundle={portfolioBundle}
        defaultState={saved}
        onStateChange={(next) =>
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(pickRelativeValuesState(next, PREFERENCE_KEYS))
          )
        }
        height={420}
      />
    </Scenario>
  );
};

// A caption from the plot's provider.
const PlotCaption: FC = () => {
  const rv = useRelativeValues({ requires: "none" });
  return (
    <p className="acme-meta" data-host-content="" data-plot-unit={rv.unit?.id}>
      {rv.items.length} initiatives, in units of {rv.unit?.name}
      {rv.state.search ? `, matching “${rv.state.search}”` : ""}
    </p>
  );
};

const Linked: FC = () => {
  const [link, setLink] = useState<RelativeValuesStateInput>({
    unit: "sso",
    clusters: null,
    search: "",
  });
  const onLink = (next: RelativeValuesState<string>) =>
    setLink({ unit: next.unit, clusters: next.clusters, search: next.search });
  return (
    <Scenario
      id="S5"
      variant="linked"
      title="Linked dashboards"
      description="Two independent dashboards share the unit, clusters and search through the host's state: pick a unit (compass) or search on the left; the plot on the right follows."
      code={`const [link, setLink] = useState({ unit: "sso", clusters: null, search: "" });
const onLink = (next) => setLink({ unit: next.unit, clusters: next.clusters, search: next.search });
<RelativeValuesSingleView bundle={bundle} view="list" state={link} onStateChange={onLink} />
<RelativeValuesProvider bundle={bundle} state={link} onStateChange={onLink}>
  <PlotCaption /><RelativeValuesSingleView view="plot" />
</RelativeValuesProvider>`}
    >
      <div className="acme-two-col">
        <div data-linked="a">
          <RelativeValuesSingleView
            bundle={portfolioBundle}
            view="list"
            state={link}
            onStateChange={onLink}
            display={{ list: { groupByCluster: false, itemIds: false } }}
            height={460}
          />
        </div>
        <div data-linked="b">
          <RelativeValuesProvider
            bundle={portfolioBundle}
            state={link}
            onStateChange={onLink}
          >
            <PlotCaption />
            <RelativeValuesSingleView
              view="plot"
              display={{
                plot: {
                  plots: ["valueUncertainty"],
                  height: 360,
                  valueUncertainty: { reference: "unit" },
                },
              }}
            />
          </RelativeValuesProvider>
        </div>
      </div>
    </Scenario>
  );
};

export const S5: FC = () => (
  <ScenarioPage
    id="s5"
    title="Host state: URL, preferences, linking, imperative"
    intro="State is plain JSON, controlled per key: put it in a router, in storage, or share it between dashboards. `apiRef` drives a dashboard from host buttons."
  >
    <UrlSynced />
    <Preferences />
    <Linked />
  </ScenarioPage>
);
