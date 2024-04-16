import clsx from "clsx";
import { FC, ReactNode } from "react";

export const Layout: FC<{
  viewer: ReactNode;
  menu: ReactNode;
  changeSeedAndRunButton: ReactNode;
  indicator: ReactNode;
  xPadding: number;
}> = ({ viewer, menu, indicator, changeSeedAndRunButton, xPadding }) => {
  return (
    // `flex flex-col` helps to fit this in playground right panel and doesn't hurt otherwise
    <div className="flex flex-col overflow-y-auto">
      <div
        className={clsx(
          `mb-1 flex h-8 items-center justify-between`,
          `px-${xPadding}`
        )}
      >
        {menu}
        <div className="flex items-center">
          {indicator}
          {changeSeedAndRunButton}
        </div>
      </div>
      <div
        className="flex-1 overflow-auto px-2 pb-1"
        data-testid="dynamic-viewer-result"
      >
        {viewer}
      </div>
    </div>
  );
};
