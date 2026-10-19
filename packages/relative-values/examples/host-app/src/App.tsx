import { FC } from "react";

import {
  BundlePage,
  InitiativePage,
  LargeCatalogPage,
  LivePage,
} from "./pages.js";
import { navigate, useHashRoute } from "./useHashRoute.js";

const navItems = [
  { route: "/live", label: "Roadmap (live)" },
  { route: "/bundle", label: "Portfolio (precomputed)" },
];

export const App: FC = () => {
  const route = useHashRoute();
  const initiative = route.match(/^\/initiative\/(.+)$/)?.[1];

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
              aria-current={route === itemRoute ? "page" : undefined}
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
