import clsx from "clsx";
import { Element } from "hast";
import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Node, Parent } from "unist";
import { visitParents } from "unist-util-visit-parents";

import { SquiggleEditor } from "../components/SquiggleEditor.js";
import { SquigglePlayground } from "../components/SquigglePlayground/index.js";
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
const codeBlockStyles = `
  .prose pre {
    color: inherit;
    background-color: transparent;
    overflow-x: auto;
    font-weight: 400;
    margin: 0;
    padding: 0;
  }
  .prose .code-block-wrapper {
    margin-top: 1.7142857em;
    margin-bottom: 1.7142857em;
  }
`;

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  md,
  className,
  textColor,
  textSize,
  backgroundColor = "bg-slate-50",
}) => {
  return (
    <>
      <style>{codeBlockStyles}</style>
      <ReactMarkdown
        className={clsx(
          "prose",
          className,
          textColor || "prose-stone",
          textSize === "sm" ? "text-sm" : "text-xs"
        )}
        rehypePlugins={[rehypeInlineCodeProperty, rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <React.Fragment>{children}</React.Fragment>,
          code({ node, className, children, ...rest }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline =
              node && (node as Element).properties["inline"] === "true";

            if (isInline) {
              return (
                <code
                  {...rest}
                  className="not-prose break-words rounded-sm border border-black border-opacity-[0.04] bg-black bg-opacity-[0.03] px-1 py-0.5 font-mono text-[.9em]"
                >
                  {children}
                </code>
              );
            }

            if (match && match[1] === "squigglePlayground") {
              const numLinesInText = String(children).match(/\n/g)?.length || 0;
              const linesToShow = Math.min(Math.max(numLinesInText, 4), 30);
              const height = 31 + linesToShow * (textSize === "sm" ? 20 : 18);
              return (
                <div className="pb-4 pt-2">
                  <SquigglePlayground
                    defaultCode={String(children).replace(/\n$/, "")}
                    height={height}
                  />
                </div>
              );
            } else if (match && match[1] === "squiggleEditor") {
              return (
                <div className="pb-4 pt-2">
                  <SquiggleEditor
                    defaultCode={String(children).replace(/\n$/, "")}
                    editorFontSize={textSize === "sm" ? 13 : 12}
                  />
                </div>
              );
            }

            return (
              <div
                className={clsx(
                  "code-block-wrapper overflow-hidden rounded",
                  backgroundColor
                )}
              >
                <div className="p-4">
                  {match ? (
                    <CodeSyntaxHighlighter {...rest} language={match[1]}>
                      {String(children).replace(/\n$/, "")}
                    </CodeSyntaxHighlighter>
                  ) : (
                    <code {...rest}>{children}</code>
                  )}
                </div>
              </div>
            );
          },
          details: ({ children, ...props }) => (
            <details className="mb-4 rounded-lg border p-4" {...props}>
              {children}
            </details>
          ),
          summary: ({ children }) => (
            <summary className="cursor-pointer font-semibold">
              {children}
            </summary>
          ),
        }}
      >
        {md}
      </ReactMarkdown>
    </>
  );
};
