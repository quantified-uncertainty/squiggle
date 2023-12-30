import clsx from "clsx";
import { Element } from "hast";
import React, { FC, HTMLAttributes, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { codeToHtml } from "shikiji";
import { Node, Parent } from "unist";
import { visitParents } from "unist-util-visit-parents";

// Adds `inline` property to `code` elements, to distinguish between inline and block code snippets.
function rehypeInlineCodeProperty() {
  return function (tree: Node) {
    visitParents(tree, "element", function (node: Node, parents: Parent[]) {
      const element = node as Element;
      if (element.tagName === "code") {
        const lastParent = parents[parents.length - 1] as Element;
        if (!element.properties) element.properties = {};
        //It should be a string, because it can't be a boolean.
        element.properties.inline = String(
          !(lastParent && lastParent.tagName === "pre")
        );
      }
    });
  };
}

const SyntaxHighlighter: FC<
  { children: string; language: string } & Omit<
    HTMLAttributes<HTMLElement>,
    "children"
  >
> = ({ children, language, ...rest }) => {
  const [html, setHtml] = useState(children);

  // Syntax-highlighted blocks will start unstyled, that's fine.
  useEffect(() => {
    (async () => {
      setHtml(
        await codeToHtml(children, {
          lang: language,
          theme: "vitesse-light", // TODO - write a custom theme that would match Codemirror styles
        })
      );
    })();
  });

  return (
    <div
      className="*:!bg-inherit" // shiki themes add background color, so we have to override it
      dangerouslySetInnerHTML={{ __html: html }}
      {...rest}
    />
  );
};

type MarkdownViewerProps = {
  md: string;
  textSize: "sm" | "xs";
  textColor?: "prose-stone" | "prose-slate";
  className?: string;
};
export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  md,
  className,
  textColor,
  textSize,
}) => {
  return (
    <ReactMarkdown
      className={clsx(
        "prose prose-stone",
        className,
        textColor || "prose-stone",
        textSize === "sm" ? "text-sm" : "text-xs"
      )}
      rehypePlugins={[rehypeInlineCodeProperty]}
      remarkPlugins={[remarkGfm]}
      components={{
        pre({ children }) {
          return (
            <pre className="rounded bg-slate-50 p-3 my-1 not-prose text-[.9em]">
              {children}
            </pre>
          );
        },
        code(props) {
          const { node, children, className, ...rest } = props;
          const match = /language-(\w+)/.exec(className || "");
          const isInline = node && node.properties.inline;
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
            <SyntaxHighlighter {...rest} language={match[1]}>
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
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
