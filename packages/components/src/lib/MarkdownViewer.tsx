import clsx from "clsx";
import { Element } from "hast";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Node, Parent } from "unist";
import { visitParents } from "unist-util-visit-parents";

import { CodeSyntaxHighlighter } from "./CodeSyntaxHighlighter.js";

// Adds `inline` property to `code` elements, to distinguish between inline and block code snippets.
function rehypeInlineCodeProperty() {
  return function (tree: Node) {
    visitParents(tree, "element", function (node: Node, parents: Parent[]) {
      const element = node as Element;
      if (element.tagName === "code") {
        const lastParent = parents[parents.length - 1] as Element;
        if (!element.properties) element.properties = {};
        //It should be a string, because it can't be a boolean.
        element.properties["inline"] = String(
          !(lastParent && lastParent.tagName === "pre")
        );
      }
    });
  };
}

type MarkdownViewerProps = {
  md: string;
  textSize: "sm" | "xs";
  textColor?: "prose-stone" | "prose-slate";
  className?: string;
  bgColor?: string;
  positioning?: string;
  rounded?: string;
};
export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  md,
  className,
  bgColor = "bg-slate-50",
  textColor,
  textSize,
  positioning = "p-2 my-1",
  rounded = "rounded",
}) => {
  return (
    <ReactMarkdown
      className={clsx(
        "prose",
        className,
        textColor || "prose-stone",
        textSize === "sm" ? "text-sm" : "text-xs"
      )}
      rehypePlugins={[rehypeInlineCodeProperty]}
      remarkPlugins={[remarkGfm]}
      components={{
        pre({ children }) {
          return (
            <pre
              className={clsx(
                "not-prose text-[.9em]",
                bgColor,
                positioning,
                rounded
              )}
            >
              {children}
            </pre>
          );
        },
        code(props) {
          const { node, children, className, ...rest } = props;
          const match = /language-(\w+)/.exec(className || "");
          const isInline = node && node.properties["inline"];
          if (isInline === "true") {
            return (
              <code
                {...rest}
                className="not-prose border-black border border-opacity-[0.04] bg-opacity-[0.03] bg-black px-1 py-0.5 rounded-sm break-words font-mono text-[.9em]"
              >
                {children}
              </code>
            );
          }
          return match ? (
            <CodeSyntaxHighlighter {...rest} language={match[1]}>
              {String(children).replace(/\n$/, "")}
            </CodeSyntaxHighlighter>
          ) : (
            <code {...rest}>{children}</code>
          );
        },
      }}
    >
      {md}
    </ReactMarkdown>
  );
};
