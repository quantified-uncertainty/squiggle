import { FC, ReactNode } from "react";

export const SnippetText: FC<{ children: string }> = ({ children }) => {
  // 'foo<b>bar</b>baz' -> ['foo', '<b>bar', '</b>baz']
  const parts = children.split(/(?=<\/?b>)/);

  const nodes: ReactNode[] = [];
  let bold = false;
  for (let part of parts) {
    if (part.startsWith("<b>")) {
      bold = true;
      part = part.replace(/^<b>/, "");
    } else if (part.startsWith("</b>")) {
      bold = false;
      part = part.replace(/^<\/b>/, "");
    }
    nodes.push(bold ? <strong>{part}</strong> : part);
  }

  return nodes;
};
