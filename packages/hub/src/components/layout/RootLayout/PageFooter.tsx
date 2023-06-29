"use client";

import { isModelRoute } from "@/routes";
import { usePathname } from "next/navigation";
import { FC } from "react";

export const PageFooter: FC = () => {
  const pathname = usePathname();
  if (isModelRoute(pathname)) {
    return null; // hide footer on model pages
  }

  return (
    <div className="p-8 border-t border-t-slate-200 bg-slate-100">
      <div className="text-sm text-slate-500">
        By{" "}
        <a
          href="https://quantifieduncertainty.org"
          className="text-blue-500 hover:underline"
        >
          QURI
        </a>
      </div>
    </div>
  );
};
