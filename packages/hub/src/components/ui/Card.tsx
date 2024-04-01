import { FC, PropsWithChildren } from "react";

export const Card: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="px-5 py-3 rounded bg-white border border-gray-200 hover:bg-gray-50">
      {children}
    </div>
  );
};
