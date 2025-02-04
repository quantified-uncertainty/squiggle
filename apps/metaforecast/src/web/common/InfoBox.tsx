import { FC, PropsWithChildren } from "react";

export const InfoBox: FC<PropsWithChildren> = ({ children }) => (
  <p className="border border-transparent bg-gray-200 px-4 py-2 text-center text-gray-700">
    {children}
  </p>
);
