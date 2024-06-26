import React from "react";

export const FormSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div>
    <header className="text-md font-medium leading-4 text-slate-600">
      {title}
    </header>
    <div className="mt-4">{children}</div>
  </div>
);
