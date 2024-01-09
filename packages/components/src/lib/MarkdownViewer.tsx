import clsx from "clsx";
import { Element } from "hast";
import React, { FC, HTMLAttributes, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  type BundledLanguage,
  bundledLanguages,
  getHighlighter,
  type Highlighter,
  type LanguageRegistration,
} from "shikiji";
import { Node, Parent } from "unist";
import { visitParents } from "unist-util-visit-parents";

// Import assertion here would be nice, but storybook doesn't support "assert" syntax yet, only "with" syntax,
// and our import sorter auto-replaces with the newer "assert" syntax.
// This will be fixed in storybook eventually, https://github.com/storybookjs/storybook/issues/23599
import squiggleGrammar from "@quri/squiggle-textmate-grammar/dist/squiggle.tmLanguage.json";

type SupportedLanguage = BundledLanguage | "squiggle";

let _shiki: Highlighter; // cached singleton
async function codeToHtml(params: {
  code: string;
  language: SupportedLanguage;
}) {
  if (!_shiki) {
    _shiki = await getHighlighter({
      themes: ["vitesse-light"],
      langs: [
        {
          name: "squiggle",
          ...squiggleGrammar,
        } as unknown as LanguageRegistration, // shikiji requires repository.$self and repository.$base that we don't have
      ],
    });
  }
  if (
    params.language !== "squiggle" &&
    !_shiki.getLoadedLanguages().includes(params.language)
  ) {
    await _shiki.loadLanguage(params.language);
    await _shiki.loadLanguage(params.language); // somehow repeating it twice fixes the loading issue
  }

  return _shiki.codeToHtml(params.code, {
    theme: "vitesse-light", // TODO - write a custom theme that would match Codemirror styles
    lang: params.language,
  });
}

function isSupportedLanguage(language: string): language is BundledLanguage {
  return language === "squiggle" || language in bundledLanguages;
}

// Adds `inline` property to `code` elements, to distinguish between inline and block code snippets.
function rehypeInlineCodeProperty() {
  return function (tree: Node) {
    visitParents(tree, "element", function (node: Node, parents: Parent[]) {
      const element = node as Element;
      if (element.tagName === "code") {
        const lastParent = parents[parents.length - 1] as Element;
        if (!element.properties) element.properties = {};
        //It should be a string, because it can't be a boolean.
        element.properties['inline'] = String(
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
      if (isSupportedLanguage(language)) {
        setHtml(await codeToHtml({ code: children, language }));
      }
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
            <pre className="rounded bg-slate-50 p-2 my-1 not-prose text-[.9em]">
              {children}
            </pre>
          );
        },
        code(props) {
          const { node, children, className, ...rest } = props;
          const match = /language-(\w+)/.exec(className || "");
          const isInline = node && node.properties['inline'];
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
