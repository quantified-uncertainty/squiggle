import * as React from "react";
export const ErrorBox: React.FC<{
  heading: string;
  children: React.ReactNode;
}> = ({ heading = "Error", children }) => {
  return (
    <div className="border border-red-200 bg-gray-50 p-4">
      <h3>{heading}</h3>
      {children}
    </div>
  );
};
