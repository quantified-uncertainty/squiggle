import { FC } from "react";

import {
  type RelativeValuesLabels,
  RelativeValuesBundleDashboard,
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
  </ScenarioPage>
);
