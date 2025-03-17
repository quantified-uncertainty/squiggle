import { FC, ReactNode } from "react";

/**
 * A component for displaying a key-value pair. Useful for quick prototyping.
 */
export const KeyValue: FC<{
  name: string;
  value: ReactNode;
}> = ({ name, value }) => {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{name}</p>
      {typeof value === "string" || typeof value === "number" ? (
        <p className="text-sm text-gray-900">{value}</p>
      ) : (
        value
      )}
    </div>
  );
};
