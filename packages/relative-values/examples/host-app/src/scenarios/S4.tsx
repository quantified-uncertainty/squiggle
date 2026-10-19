import { FC, PropsWithChildren } from "react";

import {
  type RelativeValuesComponents,
  RelativeValuesBundleDashboard,
  RelativeValuesPairDetails,
  RelativeValuesProvider,
  RelativeValuesRoot,
  RelativeValuesSearchBox,
  RelativeValuesSingleView,
  RelativeValuesSortMenu,
  RelativeValuesUnitPicker,
} from "@quri/squiggle-relative-values";

import { portfolioBundle } from "../portfolio.js";
import { Scenario, ScenarioPage } from "./Scenario.js";

// Host components (Acme's design system).
const AcmeSegmented: FC<{
  value: string;
  onChange(value: string): void;
  options: { value: string; label: string }[];
}> = ({ value, onChange, options }) => (
  <div className="acme-segmented" role="tablist" data-host-content="">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        role="tab"
        aria-selected={option.value === value}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const AcmeDrawer: FC<PropsWithChildren<{ title: string; onClose(): void }>> = ({
  title,
  onClose,
  children,
}) => (
  <div className="acme-drawer" data-host-content="">
    <div className="acme-drawer-title">
      <strong>{title}</strong>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
    {children}
  </div>
);

// Slots get the built-in implementation as `Default`. Defined outside of
// render, so that they keep their identity.
const components: Partial<RelativeValuesComponents> = {
  TabBar: ({ tabs, active, onChange }) => (
    <AcmeSegmented
      value={active}
      onChange={onChange}
      options={tabs.map((t) => ({ value: t.id, label: t.label }))}
    />
  ),
  Toolbar: ({ children }) => (
    <div className="acme-row" data-host-content="">
      {children}
      <button type="button" className="acme-small-button" data-host-export="">
        Export CSV
      </button>
    </div>
  ),
  PairDetails: ({ numerator, denominator, result, close, Default }) => (
    <AcmeDrawer
      title={`${numerator.name} / ${denominator.name}`}
      onClose={close}
    >
      <Default
        numerator={numerator}
        denominator={denominator}
        result={result}
        close={close}
      />
    </AcmeDrawer>
  ),
  Error: ({ error }) => (
    <div className="acme-alert" data-host-content="">
      <strong>Couldn&apos;t load the comparisons.</strong>{" "}
      {error.split("\n").slice(0, 2).join(" ")}
    </div>
  ),
};

export const S4: FC = () => (
  <ScenarioPage
    id="s4"
    title="Hide or replace controls"
    intro="`controls` hides built-in pieces one by one; `components` replaces them in place (each slot gets the built-in one as `Default`); primitives place them in the host's own layout."
  >
    <Scenario
      id="S4"
      variant="slots"
      title="Acme tab bar, toolbar and drawer"
      description="Hidden: the title, Table Settings, Column Settings, the cluster diagram, the grid mode icons and the plot's cluster panel. Click a value to open the pair in the Acme drawer."
      code={`<RelativeValuesBundleDashboard bundle={bundle}
  controls={{ header: false, list: { settings: false },
    grid: { columnSettings: false, clusterDiagram: false, modeControls: false },
    plot: { clusterFilter: false }, sortMenu: { sortOptions: ["default", "median", "name"] } }}
  components={{ TabBar, Toolbar, PairDetails }} />`}
    >
      <RelativeValuesBundleDashboard
        bundle={portfolioBundle}
        controls={{
          header: false,
          list: { settings: false },
          grid: {
            columnSettings: false,
            clusterDiagram: false,
            modeControls: false,
          },
          plot: { clusterFilter: false },
          sortMenu: { sortOptions: ["default", "median", "name"] },
        }}
        components={components}
        display={{ list: { sidebarPosition: "below" } }}
        height={560}
      />
    </Scenario>
    <Scenario
      id="S4"
      variant="primitives"
      title="Controls in the host's header"
      description="One provider: the search box, unit picker and sort menu sit in Acme's toolbar (each in a RelativeValuesRoot, so the markup between them keeps Acme's styles); the pair details sit in an Acme panel."
      code={`<RelativeValuesProvider bundle={bundle} precompute>
  <header className="acme-toolbar">
    <h2>Portfolio</h2>
    <RelativeValuesRoot><RelativeValuesSearchBox placeholder="Search initiatives" /></RelativeValuesRoot>
    <RelativeValuesRoot><RelativeValuesUnitPicker /></RelativeValuesRoot>
    <RelativeValuesRoot><RelativeValuesSortMenu sections={["sort"]} /></RelativeValuesRoot>
  </header>
  <RelativeValuesSingleView view="list" controls={{ list: { toolbar: false, sidebar: false } }} />
  <aside className="acme-panel"><RelativeValuesRoot><RelativeValuesPairDetails /></RelativeValuesRoot></aside>
</RelativeValuesProvider>`}
    >
      <RelativeValuesProvider bundle={portfolioBundle} precompute>
        <header className="acme-toolbar">
          <h2 data-host-heading="">Portfolio</h2>
          <div className="acme-toolbar-actions">
            <RelativeValuesRoot>
              <RelativeValuesSearchBox placeholder="Search initiatives" />
            </RelativeValuesRoot>
            <RelativeValuesRoot>
              <RelativeValuesUnitPicker />
            </RelativeValuesRoot>
            <RelativeValuesRoot>
              <RelativeValuesSortMenu axis="rows" sections={["sort"]} />
            </RelativeValuesRoot>
          </div>
        </header>
        <div className="acme-two-col">
          <RelativeValuesSingleView
            view="list"
            controls={{ list: { toolbar: false, sidebar: false } }}
            display={{ list: { groupByCluster: false, itemIds: false } }}
          />
          <aside className="acme-panel" data-host-aside="">
            <h3>Selected pair</h3>
            <RelativeValuesRoot>
              <RelativeValuesPairDetails />
            </RelativeValuesRoot>
            <p className="acme-meta">Click a value to see it here.</p>
          </aside>
        </div>
      </RelativeValuesProvider>
    </Scenario>
    <Scenario
      id="S4"
      variant="error"
      title="An error, in the host's style"
      description="The `Error` slot, for a bundle that doesn't validate."
      code={`<RelativeValuesBundleDashboard bundle={{ version: 1 }} components={{ Error }} />`}
    >
      <RelativeValuesBundleDashboard
        bundle={{ version: 1 }}
        components={components}
      />
    </Scenario>
  </ScenarioPage>
);
