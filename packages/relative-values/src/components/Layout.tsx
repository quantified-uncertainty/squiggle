import Link from "next/link";
import React, { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-slate-300">
        <div className="max-w-6xl mx-auto">
        <Link href="/">
          <div className="text-lg font-bold py-2 text-slate-600">Relative Values App</div>
        </Link>
</div>
      </div>
      {children}
    </div>
  );
};
