import { FC, PropsWithChildren } from "react";

export const ExplanationBox: FC<PropsWithChildren<{ title: string }>> = ({
  children,
  title,
}) => (
  <div className="mb-6 rounded-md bg-blue-50 p-4 text-sm text-blue-800">
    <p className="mb-2 font-medium">{title}</p>
    <div>{children}</div>
  </div>
);
