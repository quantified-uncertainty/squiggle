import { FC, PropsWithChildren } from "react";

export const NarrowPageLayout: FC<PropsWithChildren> = ({ children }) => (
  // Outer div is important because RootLayout children are flexbox items.
  // Setting max-width on flexbox items makes them switch from stretch to center mode.
  <div>
    <div className="mx-auto mb-8 mt-16 max-w-4xl">{children}</div>
  </div>
);
