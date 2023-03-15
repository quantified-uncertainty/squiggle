import Link from "next/link";
import React, { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen">
      <div className="bg-gray-100">
        <Link href="/">
          <div className="text-lg font-medium p-4">Relative values</div>
        </Link>
      </div>
      {children}
    </div>
  );
};
