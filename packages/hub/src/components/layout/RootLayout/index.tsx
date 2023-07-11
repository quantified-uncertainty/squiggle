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
      <div className="flex-1">
        <PageMenu />
        <div>{children}</div>
      </div>
      {showFooter && <PageFooter />}
    </div>
  );
};
