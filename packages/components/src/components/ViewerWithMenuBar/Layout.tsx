import { FC, ReactNode } from "react";

export const Layout: FC<{
  viewer: ReactNode;
  menu: ReactNode;
  indicator: ReactNode;
}> = ({ viewer, menu, indicator }) => {
  return (
    // `flex flex-col` helps to fit this in playground right panel and doesn't hurt otherwise
    <div className="flex flex-col overflow-y-auto">
      <div className="flex justify-between items-center px-2 h-8 mb-1">
        {menu}
        {indicator}
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