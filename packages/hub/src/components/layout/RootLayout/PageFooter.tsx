"use client";
import { FC } from "react";

export const PageFooter: FC = () => (
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
