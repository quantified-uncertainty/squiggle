import { FC } from "react";
import { Snippet } from "./Snippet";

export const TextSnippet: FC<{ children: string }> = ({ children }) => (
  <div className="text-xs text-slate-600 py-0.5">
    <Snippet>{children}</Snippet>
  </div>
);
