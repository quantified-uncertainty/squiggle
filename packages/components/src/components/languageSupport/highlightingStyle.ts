import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

// TODO: Freeze color theme after experimentation

const clampComponent = (a: number) => (a < 255 ? (a >= 0 ? a : 0) : 255);
const saturation = 0.7;
const lightness = -10;

const colors = [
  "#bea066", // numbers
  "#ba5a61", // names
  "#8797a1", // operators
  "#d4d4d4", // invalid
  "#8e949f", // separators
  "#68707f", // comments
  "#5091c7", // variables
  "#247ea2", // strings
  "#ae8055", // constants
  "#a564b8", // keywords
].map(
  (a) =>
    "#" +
    [
      [1, 3],
      [3, 5],
      [5, 7],
    ]
      .map((s) =>
        clampComponent(
          Math.floor(
            255 - parseInt(a.substring(s[0], s[1]), 16) / saturation + lightness
          )
        )
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
);

const [
  numbers,
  names,
  operators,
  invalid,
  separators,
  comments,
  variables,
  strings,
  constants,
  keywords,
] = colors;

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
    tag: [
      tags.operator,
      tags.operatorKeyword,
      tags.url,
      tags.escape,
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
