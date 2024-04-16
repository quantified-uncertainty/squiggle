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
  backgroundColor?: string;
};
export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  md,
  className,
  textColor,
  textSize,
  backgroundColor = "bg-slate-50",
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
<<<<<<< HEAD
            <pre
              className={clsx(
                "rounded p-2 my-1 not-prose text-[.9em]",
                backgroundColor
              )}
            >
=======
            <pre className="not-prose my-1 rounded bg-slate-50 p-2 text-[.9em]">
>>>>>>> main
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
                className="not-prose break-words rounded-sm border border-black border-opacity-[0.04] bg-black bg-opacity-[0.03] px-1 py-0.5 font-mono text-[.9em]"
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
