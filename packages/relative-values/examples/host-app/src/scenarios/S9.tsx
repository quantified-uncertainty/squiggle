import { FC } from "react";

import {
  type RelativeValuesLabels,
  RelativeValuesBundleDashboard,
  RelativeValuesProvider,
  RelativeValuesRoot,
  RelativeValuesSingleView,
} from "@quri/squiggle-relative-values";

import { portfolioBundle } from "../portfolio.js";
import { Scenario, ScenarioPage } from "./Scenario.js";

const fr = new Intl.NumberFormat("fr-FR", { maximumSignificantDigits: 2 });
const frShort = new Intl.NumberFormat("fr-FR", { maximumSignificantDigits: 1 });

// Some of the built-in strings, in French.
const labels: Partial<RelativeValuesLabels> = {
  "tab.list": "Liste",
  "tab.grid": "Grille",
  "tab.plot": "Graphique",
  "list.tableSettings": "Réglages du tableau",
  "list.searchPlaceholder": "Filtrer…",
  "list.name": "Nom",
  "list.description": "Description",
  "list.valueInTermsOf": "Valeur estimée, en",
  "grid.rowSettings": "Lignes",
  "grid.columnSettings": "Colonnes",
  "grid.clusterDiagram": "Groupes",
  "menu.clusters": "Groupes",
  "menu.sortBy": "Trier par",
  "sort.default": "Par défaut",
  "sort.median": "Valeur",
  "sort.medianAverage": "Valeur moyenne",
  "sort.uncertainty": "Incertitude",
  "sort.uncertaintyAverage": "Incertitude moyenne",
  "sort.similarity": "Similarité",
  "sort.name": "Nom",
  "sort.cluster": "Groupe",
  "plot.similarity": "Carte de similarité",
  "plot.valueUncertainty": "Valeur et incertitude",
  "plot.clusters": "Groupes",
  "sidebar.value": "valeur",
  "sidebar.summary": (a, b) => (
    <>
      Valeur de {a} en {b}
    </>
  ),
  "search.chip": (query) => `Recherche : ${query}`,
  "search.clear": "Effacer la recherche",
  "cell.rangeSeparator": "à",
  "unitPicker.label": "En unités de",
};

export const S9: FC = () => (
  <ScenarioPage
    id="s9"
    title="Display: labels, numbers, density, theme"
    intro="Built-in strings are overridable, numbers go through the host's formatter, compact density tightens the views, and CSS variables theme the dashboard (and its dropdowns) without touching the scoped stylesheet."
  >
    <Scenario
      id="S9"
      variant="french"
      title="Acme's French, compact, themed dashboard"
      description="Medians formatted with Intl.NumberFormat('fr-FR'), uncertainty as a factor (×/÷), compact density, and the theme class `acme-rv` (font, accent, borders, header background)."
      code={`const fr = new Intl.NumberFormat("fr-FR", { maximumSignificantDigits: 2 });
const frShort = new Intl.NumberFormat("fr-FR", { maximumSignificantDigits: 1 });
<RelativeValuesBundleDashboard bundle={bundle} themeClassName="acme-rv"
  labels={{ "tab.list": "Liste", "list.searchPlaceholder": "Filtrer…", … }}
  format={{ locale: "fr-FR", uncertainty: "factor", precision: { value: 2 },
            formatNumber: (n, { kind }) => (kind === "median" ? fr : frShort).format(n) }}
  display={{ density: "compact", list: { itemIds: false }, grid: { cellWidth: 112 } }} />

/* host.css */
.acme-rv { --squiggle-rv-font-family: "Avenir Next", sans-serif; --squiggle-rv-accent: #0b3d91;
           --squiggle-rv-border: #c9d3e6; --squiggle-rv-header-bg: #eef2fa; }`}
    >
      <RelativeValuesBundleDashboard
        bundle={portfolioBundle}
        themeClassName="acme-rv"
        labels={labels}
        format={{
          locale: "fr-FR",
          uncertainty: "factor",
          precision: { value: 2 },
          // Medians with 2 significant digits, other numbers with 1.
          formatNumber: (n, { kind }) =>
            kind === "median" ? fr.format(n) : frShort.format(n),
        }}
        display={{
          density: "compact",
          list: { itemIds: false },
          grid: { cellWidth: 112 },
        }}
        height={560}
      />
    </Scenario>
    <Scenario
      id="S9"
      variant="plot-format"
      title="The host's number format in the plot axes"
      description="`formatNumber` also formats the canvas tick labels (place: “plot”)."
      code={`<RelativeValuesSingleView bundle={bundle} view="plot"
  format={{ formatNumber: (n) => fr.format(n) }}
  display={{ plot: { plots: ["valueUncertainty"], height: 260,
    valueUncertainty: { xScale: "linear" } } }} />`}
    >
      <RelativeValuesSingleView
        bundle={portfolioBundle}
        view="plot"
        format={{ formatNumber: (n) => fr.format(n) }}
        display={{
          plot: {
            plots: ["valueUncertainty"],
            height: 260,
            valueUncertainty: { xScale: "linear" },
          },
        }}
      />
    </Scenario>
    <Scenario
      id="S9"
      variant="sidebar"
      title="The pair details follow the number format"
      description="Uncertainty as a factor in the cells and in the sidebar; the close button's label is translated too."
      code={`<RelativeValuesSingleView bundle={bundle} view="list"
  format={{ uncertainty: "factor" }} labels={{ "sidebar.close": "Fermer" }}
  defaultState={{ selectedPair: ["auditLog", "sso"] }}
  display={{ density: "compact", list: { groupByCluster: false } }} />`}
    >
      <RelativeValuesSingleView
        bundle={portfolioBundle}
        view="list"
        format={{ uncertainty: "factor" }}
        labels={{
          "sidebar.close": "Fermer",
          "sidebar.uncertainty": "incertitude (facteur)",
        }}
        defaultState={{
          selectedPair: ["auditLog", "sso"],
          ids: ["sso", "auditLog", "usageBilling"],
        }}
        display={{ density: "compact", list: { groupByCluster: false } }}
      />
    </Scenario>
    <Scenario
      id="S9"
      variant="font-size"
      title="A larger base font size"
      description="`--squiggle-rv-font-size: 20px` (with themeClassName) scales all text."
      code={`.acme-rv-large { --squiggle-rv-font-size: 20px; }
<RelativeValuesSingleView bundle={bundle} view="list" themeClassName="acme-rv-large" … />`}
    >
      <RelativeValuesSingleView
        bundle={portfolioBundle}
        view="list"
        themeClassName="acme-rv-large"
        defaultState={{ ids: ["sso", "auditLog"] }}
        display={{ list: { groupByCluster: false } }}
      />
    </Scenario>
    <Scenario
      id="S9"
      variant="ancestor"
      title="Variables on an ancestor win over compact density"
      description="`--squiggle-rv-grid-cell-width: 180px` on a host element; the compact grid keeps it. Below: a compact grid in a provider's (comfortable) root gets the compact cells."
      code={`<div className="acme-wide-cells">
  <RelativeValuesSingleView bundle={bundle} view="grid" display={{ density: "compact" }} />
</div>
<RelativeValuesProvider bundle={bundle}><RelativeValuesRoot>
  <RelativeValuesSingleView view="grid" controls={false} display={{ density: "compact" }} />
</RelativeValuesRoot></RelativeValuesProvider>`}
    >
      <div className="acme-wide-cells" data-host-wide="">
        <RelativeValuesSingleView
          bundle={portfolioBundle}
          view="grid"
          controls={false}
          scope={{ ids: ["sso", "auditLog", "usageBilling"] }}
          display={{ density: "compact" }}
        />
      </div>
      <div data-host-in-provider="">
        <RelativeValuesProvider
          bundle={portfolioBundle}
          scope={{ ids: ["sso", "auditLog", "usageBilling"] }}
        >
          <RelativeValuesRoot>
            <RelativeValuesSingleView
              view="grid"
              controls={false}
              display={{ density: "compact" }}
            />
          </RelativeValuesRoot>
        </RelativeValuesProvider>
      </div>
    </Scenario>
    <Scenario
      id="S9"
      variant="dark"
      title="A dark theme"
      description="The documented variables (text, muted, background, borders, header and panel backgrounds, accent), and the warm uncertainty tiers recolored through `[data-rv-tier]`. The canvas axes and dropdown menus keep their colors."
      code={`.acme-rv-dark { --squiggle-rv-bg: #111827; --squiggle-rv-text: #e5e7eb; --squiggle-rv-muted: #9ca3af;
  --squiggle-rv-border: #374151; --squiggle-rv-header-bg: #1f2937; --squiggle-rv-panel-bg: #1f2937;
  --squiggle-rv-selected-bg: #374151; --squiggle-rv-accent: #93c5fd; }
.squiggle-rv.acme-rv-dark [data-rv-tier="5"] { color: #fca5a5; } /* also 3, 4 */
<RelativeValuesBundleDashboard bundle={bundle} themeClassName="acme-rv-dark" … />`}
    >
      <RelativeValuesBundleDashboard
        bundle={portfolioBundle}
        themeClassName="acme-rv-dark"
        scope={{ clusters: ["enterprise", "platform"] }}
        defaultState={{
          unit: "sso",
          selectedPair: ["auditLog", "sso"],
          search: "o",
        }}
        controls={{ list: { search: false } }}
        display={{ list: { itemIds: false } }}
      />
      <div style={{ height: 12 }} />
      <RelativeValuesSingleView
        bundle={portfolioBundle}
        view="grid"
        themeClassName="acme-rv-dark"
        scope={{ ids: ["sso", "auditLog", "usageBilling", "partnerApi"] }}
        defaultState={{ columns: "rows", gridMode: "half" }}
      />
    </Scenario>
  </ScenarioPage>
);
