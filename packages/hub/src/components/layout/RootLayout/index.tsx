import { FC, PropsWithChildren } from "react";

import { PageMenu } from "./PageMenu";
import { PageFooter } from "./PageFooter";
import { usePathname } from "next/navigation";
import { isModelRoute, isModelSubroute } from "@/routes";
import { clsx } from "clsx";

export const RootLayout: FC<PropsWithChildren> = ({ children }) => {
  const pathname = usePathname();

  const showFooter = !isModelRoute(pathname);
  const backgroundColor = isModelSubroute(pathname) ? "bg-white" : "bg-gray-50";

  return (
    <div className={clsx("min-h-screen flex flex-col", backgroundColor)}>
      <PageMenu />
      <div
        // This allows us to center children vertically if necessary, e.g. in `not-found.tsx`.
        // Note that setting `height: 100%` instead of `flex-1` on children won't work;
        // see https://stackoverflow.com/questions/8468066/child-inside-parent-with-min-height-100-not-inheriting-height for details.
        className="flex-1 flex flex-col"
      >
        {children}
      </div>
      {showFooter && <PageFooter />}
    </div>
  );
};
