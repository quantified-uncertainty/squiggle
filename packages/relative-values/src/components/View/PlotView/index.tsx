import { ModelEvaluator } from "@/values/ModelEvaluator";
import clsx from "clsx";
import { FC, PropsWithChildren } from "react";
import { ClusterFilter } from "../ClusterFilter";
import { ForcePlot } from "./ForcePlot";
import { ValueAndUncertaintyPlot } from "./ValueAndUncertaintyPlot";

const Section: FC<PropsWithChildren<{ title: string; border?: boolean }>> = ({
  title,
  border,
  children,
}) => (
  <div className="flex flex-col gap-2 items-center">
    <header className="text-slate-800 font-bold">{title}</header>
    <div className={clsx(border && "border border-slate-100 p-1")}>
      {children}
    </div>
  </div>
);

export const PlotView: FC<{
  model: ModelEvaluator;
}> = ({ model }) => {
  return (
    <div className="flex gap-2 max-w-6xl mx-auto">
      <Section title="Value and Uncertainty" border>
        <ValueAndUncertaintyPlot model={model} />
      </Section>
      <Section title="Force" border>
        <ForcePlot model={model} />
      </Section>
      <Section title="Clusters">
        <ClusterFilter axis="rows" />
      </Section>
    </div>
  );
};
