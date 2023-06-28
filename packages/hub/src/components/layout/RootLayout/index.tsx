import { FC, PropsWithChildren } from "react";

import { PageMenu } from "./PageMenu";
import { PageFooter } from "./PageFooter";

export const RootLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <PageMenu />
        <div>{children}</div>
      </div>
      <PageFooter />
    </div>
  );
};
