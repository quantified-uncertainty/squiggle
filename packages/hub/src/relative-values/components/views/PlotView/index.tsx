import clsx from "clsx";
import { FC, PropsWithChildren } from "react";

import { ClusterFilter } from "../ClusterFilter";
import { useRelativeValuesContext } from "../RelativeValuesProvider";
import { ForcePlot } from "./ForcePlot";
import { ValueAndUncertaintyPlot } from "./ValueAndUncertaintyPlot";

const Section: FC<PropsWithChildren<{ title: string; border?: boolean }>> = ({
  title,
  border,
  children,
}) => (
  <div className="flex flex-col gap-2">
    <header className="text-center font-bold text-slate-800">{title}</header>
    <div className={clsx(border && "border border-slate-100 p-1")}>
      {children}
    </div>
  </div>
);

export const PlotView: FC = () => {
  const { evaluator: model } = useRelativeValuesContext();

  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: "1fr minmax(120px, max-content)",
      }}
    >
      <Section title="Similarity Cluster Map" border>
        <ForcePlot model={model} />
      </Section>
      <Section title="Clusters">
        <ClusterFilter axis="rows" />
      </Section>
    </div>
  );
};
