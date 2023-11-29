import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

const numbers = "#001063";
const names = "#00746a";
const operators = "#341d0e";
const invalid = "#000000";
const separators = "#2a2111";
const comments = "#60553f";
const variables = "#822500";
const strings = "#9b2d00";
const escapes = "#e10303";
const constants = "#003e7b";
const keywords = "#096600";

export const lightThemeHighlightingStyle = HighlightStyle.define([
  { tag: tags.keyword, fontWeight: "bold", color: keywords },
  {
    tag: [
      tags.name,
      tags.deleted,
      tags.character,
      tags.propertyName,
      tags.macroName,
    ],
    color: names,
  },
  {
    tag: [
      tags.function(tags.variableName),
      tags.constant(tags.variableName),
      tags.labelName,
    ],
    color: variables,
  },
  {
    tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)],
    color: constants,
  },
  { tag: [tags.definition(tags.name), tags.separator], color: separators },
  {
    tag: [
      tags.typeName,
      tags.className,
      tags.number,
      tags.changed,
      tags.annotation,
      tags.modifier,
      tags.self,
      tags.namespace,
    ],
    color: numbers,
  },
  {
    tag: [tags.escape],
    color: escapes,
  },
  {
    tag: [
      tags.operator,
      tags.operatorKeyword,
      tags.url,
      tags.regexp,
      tags.link,
      tags.special(tags.string),
    ],
    fontWeight: "bold",
    color: operators,
  },
  { tag: [tags.meta, tags.comment], color: comments },
  { tag: tags.strong, fontWeight: "bold" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: tags.link, color: comments, textDecoration: "underline" },
  { tag: tags.heading, fontWeight: "bold", color: names },
  {
    tag: [tags.atom, tags.bool, tags.special(tags.variableName)],
    color: constants,
  },
  {
    tag: [tags.processingInstruction, tags.string, tags.inserted],
    color: strings,
  },
  { tag: tags.invalid, color: invalid },
]);
