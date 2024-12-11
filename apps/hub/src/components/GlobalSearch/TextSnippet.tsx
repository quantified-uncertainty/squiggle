import { FC } from "react";
import { Snippet } from "./Snippet";

export const TextSnippet: FC<{ children: string }> = ({ children }) => (
  <div className="py-0.5 text-xs text-slate-600">
    <Snippet>{children}</Snippet>
  </div>
);
