"use client";
import { FC, PropsWithChildren } from "react";

export const tailwindSelector = "squiggle-relative-values squiggle";

export const Tailwind: FC<PropsWithChildren> = ({ children }) => (
  <div className={tailwindSelector}>{children}</div>
);
