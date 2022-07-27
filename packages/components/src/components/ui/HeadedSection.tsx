import React from "react";

export const HeadedSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div>
    <header className="text-lg leading-6 font-medium text-gray-900">
      {title}
    </header>
    <div className="mt-4">{children}</div>
  </div>
);
