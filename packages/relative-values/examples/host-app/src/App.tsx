import { FC } from "react";

import {
  BundlePage,
  InitiativePage,
  LargeCatalogPage,
  LivePage,
} from "./pages.js";
import { scenarios } from "./scenarios/index.js";
import { navigate, useHashRoute } from "./useHashRoute.js";

const navItems = [
  { route: "/live", label: "Roadmap (live)" },
  { route: "/bundle", label: "Portfolio (precomputed)" },
  { route: "/scenarios", label: "Scenarios" },
];

const ScenarioIndex: FC = () => (
  <>
    <h1>Embedding scenarios</h1>
    <p>
      How a host app controls the relative values dashboards: one page per
      scenario, each with the code it uses.
    </p>
    <ol className="acme-scenario-index">
      {scenarios.map((scenario) => (
        <li key={scenario.id}>
          <a href={`#/${scenario.id}`}>{scenario.title}</a>
          <span className="acme-meta"> — {scenario.summary}</span>
        </li>
      ))}
    </ol>
  </>
);

export const App: FC = () => {
  const route = useHashRoute();
  const initiative = route.match(/^\/initiative\/(.+)$/)?.[1];
  const scenario = scenarios.find((s) => route === `/${s.id}`);
  const section = scenario || route === "/scenarios" ? "/scenarios" : route;

  return (
    <>
      <header className="acme-header" data-host-header="">
        <div className="acme-logo">
          Acme Robotics
          <small>Strategy portal</small>
        </div>
        <nav className="acme-nav">
          {navItems.map(({ route: itemRoute, label }) => (
            <button
              key={itemRoute}
              type="button"
              aria-current={section === itemRoute ? "page" : undefined}
              onClick={() => navigate(itemRoute)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>
      <main className="acme-main">
        {initiative ? (
          <InitiativePage id={decodeURIComponent(initiative)} />
        ) : scenario ? (
          <scenario.Page />
        ) : route === "/scenarios" ? (
          <ScenarioIndex />
        ) : route === "/bundle" ? (
          <BundlePage />
        ) : route === "/large" ? (
          <LargeCatalogPage />
        ) : (
          <LivePage />
        )}
      </main>
      <footer className="acme-footer">
        © Acme Robotics. Internal use only.
      </footer>
    </>
  );
};
