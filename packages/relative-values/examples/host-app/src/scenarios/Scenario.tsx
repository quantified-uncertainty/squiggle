import { FC, PropsWithChildren, ReactNode } from "react";

/**
 * One example on a scenario page. The screenshot script captures each
 * `[data-scenario][data-variant]` element as `s<n>-<variant>.png`.
 */
export const Scenario: FC<
  PropsWithChildren<{
    id: string;
    variant: string;
    title: string;
    description?: ReactNode;
    // Host UI above the dashboard (inputs, readouts).
    controls?: ReactNode;
    code?: string;
  }>
> = ({ id, variant, title, description, controls, code, children }) => (
  <section className="acme-scenario" data-scenario={id} data-variant={variant}>
    <h2>{title}</h2>
    {description && <p className="acme-meta">{description}</p>}
    {controls && <div className="acme-scenario-controls">{controls}</div>}
    <div className="acme-card">{children}</div>
    {code && (
      <details className="acme-code">
        <summary>Code</summary>
        <pre>{code.trim()}</pre>
      </details>
    )}
  </section>
);

export const ScenarioPage: FC<
  PropsWithChildren<{ id: string; title: string; intro: ReactNode }>
> = ({ id, title, intro, children }) => (
  <div data-scenario-page={id}>
    <p className="acme-breadcrumb">
      <a href="#/scenarios">Scenarios</a> / {id.toUpperCase()}
    </p>
    <h1>{title}</h1>
    <p>{intro}</p>
    {children}
  </div>
);
