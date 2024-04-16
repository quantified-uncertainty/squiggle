import { FC } from "react";

export const PlotTitle: FC<{ title: string }> = ({ title }) => {
  return (
    <div className="text-center text-sm font-semibold text-slate-700">
      {title}
    </div>
  );
};
