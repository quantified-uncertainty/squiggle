import { FC, PropsWithChildren } from "react";

export const NarrowPageLayout: FC<PropsWithChildren> = ({ children }) => (
  <div className="mt-16 max-w-2xl mx-auto mb-4">{children}</div>
);
