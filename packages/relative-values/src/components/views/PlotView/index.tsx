"use client";
import clsx from "clsx";
import { FC, PropsWithChildren, useCallback, useMemo } from "react";

import { autoPlotReference } from "../../../state/pairs.js";
import type { Item } from "../../../types.js";
import { useCore } from "../../host/core.js";
import { usePresentation } from "../../host/presentation.js";
import type { ConsumerRequirement } from "../../host/requirements.js";
import { ViewToolbar } from "../../host/slots.js";
import type { RelativeValuesReadyController } from "../../host/types.js";
import { useRelativeValuesConsumer } from "../../useRelativeValues.js";
import { ClusterFilter } from "../ClusterFilter.js";
import { SearchChip, ViewEmpty, ViewStatus } from "../ViewStatus.js";
import { ForcePlot } from "./ForcePlot.js";
import { ValueAndUncertaintyPlot } from "./ValueAndUncertaintyPlot.js";

const Section: FC<
  PropsWithChildren<{ title: string | undefined; border?: boolean }>
> = ({ title, border, children }) => (
  <div className="flex flex-col gap-2">
    {title !== undefined && (
      <header className="text-center font-bold text-[color:var(--squiggle-rv-text,#1e293b)]">
        {title}
      </header>
    )}
    <div
      className={clsx(
        border && "border border-[color:var(--squiggle-rv-border,#f1f5f9)] p-1"
      )}
    >
      {children}
    </div>
  </div>
);

const PlotViewContent: FC<{ rv: RelativeValuesReadyController }> = ({ rv }) => {
  const core = useCore();
  const { controls, display, labels, options, components, format } =
    usePresentation();
  const { plots, height, titles, valueUncertainty } = display.plot;
  const { onItemClick } = options;

  const reference = useMemo((): Item[] => {
    switch (valueUncertainty.reference) {
      case "unit":
        return rv.unit ? [rv.unit] : [];
      case "average":
        return rv.universe;
      case "auto":
        return autoPlotReference(rv);
    }
  }, [valueUncertainty.reference, rv]);

  const selectLocked = core.isLocked("selectedItem");
  const selectedItem = rv.state.selectedItem;
  const clickItem = useCallback(
    (item: Item) => {
      onItemClick?.(item);
      if (!selectLocked) {
        core.dispatch(
          {
            type: "selectItem",
            id: selectedItem === item.id ? null : item.id,
          },
          "user"
        );
      }
    },
    [onItemClick, selectLocked, core, selectedItem]
  );

  // The plots in the order of `display.plot.plots`; the Clusters panel is
  // next to the first one (and hidden without plots).
  const shownPlots = plots.filter(
    (plot, i) =>
      (plot === "similarity" || plot === "valueUncertainty") &&
      plots.indexOf(plot) === i
  );
  const showClusters =
    shownPlots.length > 0 &&
    controls.plot.clusterFilter &&
    !core.isLocked("clusters");
  // The toolbar has no built-in controls: it's for a Toolbar slot.
  const showToolbar = controls.plot.toolbar && !!components.Toolbar;

  const renderPlot = (plot: (typeof shownPlots)[number]) => {
    switch (plot) {
      case "similarity":
        return (
          <Section
            title={titles ? labels["plot.similarity"] : undefined}
            border
          >
            <ForcePlot
              items={rv.items}
              clusters={rv.clusters}
              compare={rv.compare}
              height={height}
              selectedItem={selectedItem}
              onItemClick={clickItem}
            />
          </Section>
        );
      case "valueUncertainty":
        return (
          <Section
            title={titles ? labels["plot.valueUncertainty"] : undefined}
            border
          >
            <ValueAndUncertaintyPlot
              items={rv.items}
              reference={reference}
              clusters={rv.clusters}
              compare={rv.compare}
              height={height}
              xScale={valueUncertainty.xScale}
              yScale={valueUncertainty.yScale}
              labels={labels}
              format={format}
              selectedItem={selectedItem}
              onItemClick={clickItem}
            />
          </Section>
        );
    }
  };

  return (
    <div
      data-rv-part="plot"
      data-rv-provider={core.id}
      data-rv-count={rv.items.length}
    >
      {showToolbar && (
        <ViewToolbar view="plot" className="mb-2 flex items-center gap-2" />
      )}
      <div className="mb-2 empty:hidden">
        <SearchChip />
      </div>
      {rv.items.length === 0 ? (
        <ViewEmpty controller={rv} view="plot" />
      ) : shownPlots.length === 0 ? null : (
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: showClusters
              ? "1fr minmax(120px, max-content)"
              : "1fr",
          }}
        >
          {shownPlots.map((plot, i) => (
            <div
              key={plot}
              data-rv-plot-section={plot}
              style={{ gridColumn: 1, gridRow: i + 1 }}
            >
              {renderPlot(plot)}
            </div>
          ))}
          {showClusters && (
            <div style={{ gridColumn: 2, gridRow: 1 }}>
              <Section title={titles ? labels["plot.clusters"] : undefined}>
                <ClusterFilter axis="rows" />
              </Section>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** The similarity map and the value / uncertainty plot. */
export const PlotView: FC = () => {
  const { display } = usePresentation();
  const { plots, valueUncertainty } = display.plot;
  const similarity = plots.includes("similarity");
  const reference = plots.includes("valueUncertainty")
    ? valueUncertainty.reference
    : null;
  const requirement = useMemo(
    (): ConsumerRequirement => ({ kind: "plot", similarity, reference }),
    [similarity, reference]
  );
  const rv = useRelativeValuesConsumer(requirement);
  if (rv.status !== "ready") {
    return <ViewStatus controller={rv} />;
  }
  return <PlotViewContent rv={rv} />;
};
