import { FC, ReactNode } from "react";

type Props = {
  addMarginToMainSection?: boolean;
  children: [ReactNode, ReactNode];
};

export const WithTopMenu: FC<Props> = ({
  addMarginToMainSection,
  children: [top, main],
}) => {
  return (
    <div>
      <div className="border-b border-slate-200">{top}</div>
      <div className={addMarginToMainSection ? "mt-4" : ""}>{main}</div>
    </div>
  );
};
