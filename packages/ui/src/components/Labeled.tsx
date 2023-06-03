import { clsx } from "clsx";
import { FC, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  label: string;
  disabled?: boolean;
}>;

export const Labeled: FC<Props> = ({ label, disabled, children }) => {
  return (
    <label className="block">
      <div
        className={clsx(
          "text-sm font-medium mb-1",
          disabled ? "text-gray-400" : "text-gray-600"
        )}
      >
        {label}
      </div>
      {children}
    </label>
  );
};
