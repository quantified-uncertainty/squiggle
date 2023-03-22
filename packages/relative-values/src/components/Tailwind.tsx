"use client";
import { FC, PropsWithChildren } from "react";

export const Tailwind: FC<PropsWithChildren> = ({ children }) => (
  <div className="squiggle-relative-values">{children}</div>
);
