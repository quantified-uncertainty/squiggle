import { FC, PropsWithChildren } from "react";

export const LineHeader: FC<PropsWithChildren> = ({ children }) => (
  <h3 className="flex items-center justify-center w-full">
    <span aria-hidden="true" className="flex-grow bg-gray-300 rounded h-0.5" />
    <span className="mx-3 text-md font-medium text-center">{children}</span>
    <span aria-hidden="true" className="flex-grow bg-gray-300 rounded h-0.5" />
  </h3>
);
