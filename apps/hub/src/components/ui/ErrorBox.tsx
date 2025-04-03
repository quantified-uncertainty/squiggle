import { FC, PropsWithChildren } from "react";

export const ErrorBox: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="rounded-md border border-red-300 bg-red-50 p-4 text-red-800">
      {children}
    </div>
  );
};
