import {
  foldInside,
  foldNodeProp,
  indentNodeProp,
  LanguageSupport,
  LRLanguage,
} from "@codemirror/language";
import { Extension } from "@codemirror/state";
import { styleTags, tags as t } from "@lezer/highlight";

import {
  CodemirrorReactProps,
  projectFacet,
  renderImportTooltipFacet,
} from "../fields.js";
import { extensionFromFacets } from "../utils.js";
import {
  builtinCompletionsFacet,
  makeCompletionSource,
} from "./autocomplete.js";
import { parser } from "./generated/squiggle.js";
import { hoverableTag } from "./highlightingStyle.js";

// Note that parser style tags depend on whether imports are hoverable. This is
// a tiny feature, but we can reuse the same idea for later customizations.
export function getLezerParser({
  hoverableImports,
}: {
  hoverableImports?: boolean;
} = {}) {
  const parserWithMetadata = parser.configure({
    props: [
      styleTags({
        "if then else import export as": t.keyword,

        Equals: t.definitionOperator,
        ArithOp: t.arithmeticOperator,
        LogicOp: t.logicOperator,
        ControlOp: t.controlOperator,

        "{ }": t.brace,
        "[ ]": t.squareBracket,
        "( )": t.paren,
        "|": t.squareBracket,
        ",": t.separator,

        Syntax: t.annotation,
        Boolean: t.bool,
        Number: t.integer,
        String: t.string,
        LineComment: t.lineComment,
        BlockComment: t.blockComment,
        Escape: t.escape,

        DecoratorName: t.variableName,
        "Decorator/*/String": t.comment,
        At: t.keyword,

        VariableName: t.constant(t.variableName),
        [[
          "Import/*/VariableName",
          "Program/*/LetStatement/VariableName",
          "Program/*/DefunStatement/VariableName",
          /**
           * TODO - this is a workaround for Lezer limitation that `*` only
           * matches a single level.
           *
           * We only support up to 3 decorators.
           *
           * There might be a better way to do this, e.g. by providing a class
           * that's used through CSS selectors, but it's complicated.
           *
           * I'm also unsure about the performance consequences of this.
           *
           * Alternatively, we could just support tooltips on _all_ variable
           * names.
           */
          "Program/*/DecoratedStatement/*/LetStatement/VariableName",
          "Program/*/DecoratedStatement/*/DecoratedStatement/*/LetStatement/VariableName",
          "Program/*/DecoratedStatement/*/DecoratedStatement/*/DecoratedStatement/*/LetStatement/VariableName",
          "Program/*/DecoratedStatement/*/DefunStatement/VariableName",
          "Program/*/DecoratedStatement/*/DecoratedStatement/*/DefunStatement/VariableName",
          "Program/*/DecoratedStatement/*/DecoratedStatement/*/DecoratedStatement/*/DefunStatement/VariableName",
        ].join(" ")]: [hoverableTag, t.constant(t.variableName)],
        Identifier: t.variableName,
        Field: t.variableName,
        LambdaParameterName: t.variableName,
        ...(hoverableImports
          ? {
              "Import/ImportName/String": [hoverableTag, t.string],
            }
          : {}),
      }),
      foldNodeProp.add({
        Lambda: (context) => ({
          from: context.getChild("NonEmptyProgram")?.from || 0,
          to: context.getChild("NonEmptyProgram")?.to || 0,
        }),
        Block: foldInside,
        Dict: foldInside,
        Array: foldInside,
      }),
      indentNodeProp.add({
        Dict: (context) =>
          context.baseIndent + (context.textAfter === "}" ? 0 : context.unit),
        Block: (context) =>
          context.baseIndent + (context.textAfter === "}" ? 0 : context.unit),
        Lambda: (context) =>
          context.baseIndent + (context.textAfter === "}" ? 0 : context.unit),
        Array: (context) =>
          context.baseIndent + (context.textAfter === "]" ? 0 : context.unit),
      }),
    ],
  });
  return parserWithMetadata;
}

export function squiggleLanguageExtension(
  initialRenderImportTooltip: CodemirrorReactProps["renderImportTooltip"]
): Extension {
  return extensionFromFacets({
    facets: [renderImportTooltipFacet],
    makeExtension: ([renderImportTooltip]) => {
      const squiggleLanguage = LRLanguage.define({
        name: "squiggle",
        parser: getLezerParser({
          hoverableImports: !!renderImportTooltip,
        }),
        languageData: {
          commentTokens: {
            line: "//",
          },
          autocomplete: makeCompletionSource(),
          closeBrackets: {
            brackets: ['"', "'", "(", "{"],
          },
        },
      });

      return new LanguageSupport(squiggleLanguage, [
        builtinCompletionsFacet.compute([projectFacet], (state) =>
          state.facet(projectFacet)
        ),
      ]);
    },
    initialValues: [initialRenderImportTooltip],
  });
}
