import { HighlightStyle } from "@codemirror/language";
import { Tag, tags } from "@lezer/highlight";
import clsx from "clsx";

/**
 * We use Tailwind classes for all styling, for consistency.
 *
 * This scheme uses many custom colors. We should either replace them
 * with tailwind colors, or move them to tailwind theme.
 */

const names = "text-[#00746a]";
const comments = "text-[#60553f]";
const constants = "text-[#003e7b]";
const variable = "text-[#822500]";

export const hoverableTag = Tag.define();

export const lightThemeHighlightingStyle = HighlightStyle.define([
  { tag: tags.keyword, class: "font-bold text-[#096600]" },
  {
    tag: [
      tags.name,
      tags.deleted,
      tags.character,
      tags.propertyName,
      tags.macroName,
    ],
    class: names,
  },
  {
    tag: [
      tags.function(tags.variableName),
      tags.constant(tags.variableName),
      tags.labelName,
    ],
    class: variable,
  },
  {
    tag: hoverableTag,
    class: "cursor-pointer hover:bg-slate-200",
  },
  {
    tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)],
    class: constants,
  },
  {
    tag: [tags.definition(tags.name), tags.separator],
    class: "text-[#2a2111]",
  },
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
    class: "text-[#001063]",
  },
  { tag: tags.escape, class: "text-[#e10303]" },
  {
    tag: [
      tags.operator,
      tags.operatorKeyword,
      tags.url,
      tags.regexp,
      tags.link,
      tags.special(tags.string),
    ],
    class: "font-bold text-[#341d0e]",
  },
  { tag: tags.comment, class: comments },
  { tag: tags.strong, class: "font-bold" },
  { tag: tags.emphasis, class: "italic" },
  { tag: tags.strikethrough, class: "line-through" },
  { tag: tags.link, class: clsx(comments, "underline") },
  { tag: tags.heading, class: clsx(names, "font-bold") },
  {
    tag: [tags.atom, tags.bool, tags.special(tags.variableName)],
    class: constants,
  },
  {
    tag: [tags.processingInstruction, tags.string, tags.inserted],
    class: "text-[#9b2d00]",
  },
  { tag: tags.invalid, class: "text-black" },
]);
