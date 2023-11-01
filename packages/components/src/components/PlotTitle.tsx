import { FC } from "react";

export const PlotTitle: FC<{ title: string }> = ({ title }) => {
  return (
    <div className="text-center font-semibold text-slate-700 text-sm">
      {title}
    </div>
  );
};
