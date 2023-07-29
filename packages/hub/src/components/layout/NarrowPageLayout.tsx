import { FC, PropsWithChildren } from "react";

export const NarrowPageLayout: FC<PropsWithChildren> = ({ children }) => (
  // Outer div is important because RootLayout children are flexbox items.
  // Setting max-width on flexbox items makes them switch from stretch to center mode.
  <div>
    <div className="mt-16 max-w-4xl mx-auto mb-8">{children}</div>
  </div>
);
