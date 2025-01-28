import { FC, PropsWithChildren } from "react";

export const InfoBox: FC<PropsWithChildren> = ({ children }) => (
  <p className="bg-gray-200 text-gray-700 py-2 px-4 border border-transparent text-center">
    {children}
  </p>
);
