import { FC, Fragment, ReactNode } from "react";

export const Snippet: FC<{ children: string }> = ({ children }) => {
  // 'foo<b>bar</b>baz' -> ['foo', '<b>bar', '</b>baz']
  const parts = children.split(/(?=<\/?b>)/);

  const nodes: ReactNode[] = [];
  let bold = false;
  for (let [i, part] of parts.entries()) {
    if (part.startsWith("<b>")) {
      bold = true;
      part = part.replace(/^<b>/, "");
    } else if (part.startsWith("</b>")) {
      bold = false;
      part = part.replace(/^<\/b>/, "");
    }
    nodes.push(
      bold ? (
        <strong key={i}>{part}</strong>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      )
    );
  }

  return nodes;
};
