import React, { FC, HTMLAttributes, useEffect, useState } from "react";
import {
  type BundledLanguage,
  bundledLanguages,
  getHighlighter,
  type Highlighter,
  type LanguageRegistration,
} from "shikiji";

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

export const CodeSyntaxHighlighter: FC<
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
