import { PropsWithChildren } from "react";

import { DesktopFrontpageNav } from "./DesktopFrontpageNav";

export default function FrontPageLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-1">
      <div className="w-56 border-r border-slate-200 px-4">
        <div className="mt-8">
          <DesktopFrontpageNav />
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
