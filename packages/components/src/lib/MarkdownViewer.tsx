import clsx from "clsx";
import { Element } from "hast";
import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Node, Parent } from "unist";
import { visitParents } from "unist-util-visit-parents";

import { SquiggleEditor } from "../components/SquiggleEditor.js";
import { SquigglePlayground } from "../components/SquigglePlayground/index.js";
import { CodeSyntaxHighlighter } from "./CodeSyntaxHighlighter.js";

// Remove leading and trailing newlines from a string. Useful for code blocks.
const trimNewlines = (str: string) => str.replace(/^\n+|\n+$/g, "");

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

type CustomComponents = Components & {
  squiggleplayground: React.ComponentType<{ children: string }>;
  squiggleeditor: React.ComponentType<{ children: string }>;
};

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
  const CustomSquigglePlayground = ({ children }: { children: string }) => {
    const trimmedChildren = trimNewlines(children);
    const numLines = (trimmedChildren.match(/\n/g) || []).length + 1;
    const linesToShow = Math.min(Math.max(numLines, 4), 30);
    const height = 31 + linesToShow * (textSize === "sm" ? 20 : 18); // This is fairly hacky, but it works for now.
    return (
      <div className="py-2">
        <SquigglePlayground defaultCode={trimmedChildren} height={height} />
      </div>
    );
  };

  const CustomSquiggleEditor = ({ children }: { children: string }) => (
    <div className="py-2">
      <SquiggleEditor
        defaultCode={trimNewlines(children)}
        editorFontSize={textSize === "sm" ? 13 : 12}
      />
    </div>
  );

  return (
    <ReactMarkdown
      className={clsx(
        "prose",
        className,
        textColor || "prose-stone",
        textSize === "sm" ? "text-sm" : "text-xs"
      )}
      rehypePlugins={[rehypeInlineCodeProperty, rehypeRaw]}
      remarkPlugins={[remarkGfm]}
      components={
        {
          pre({ children }) {
            return (
              <pre
                className={clsx(
                  "not-prose my-1 rounded p-2 text-[.9em]",
                  backgroundColor
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
          details: ({ children, ...props }) => (
            <details className="mb-2" {...props}>
              {children}
            </details>
          ),
          summary: ({ children }) => (
            <summary className="cursor-pointer select-none font-semibold">
              {children}
            </summary>
          ),
          // Custom Squiggle components
          squiggleplayground: CustomSquigglePlayground,
          squiggleeditor: CustomSquiggleEditor,
        } as CustomComponents
      }
    >
      {md}
    </ReactMarkdown>
  );
};
