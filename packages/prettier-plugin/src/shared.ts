import {
  type Parser,
  type Plugin,
  type Printer,
  type SupportLanguage,
} from "prettier";

import { squiggleParser } from "./parser.js";
import { createSquigglePrinter } from "./printer.js";
import { type PrettierUtil, type SquiggleNode } from "./types.js";

const languages: SupportLanguage[] = [
  {
    name: "Squiggle",
    parsers: ["squiggle"],
    extensions: [".squiggle"],
  },
];

const options = {};
const defaultOptions = {};

export function createPlugin(util: PrettierUtil): Plugin<SquiggleNode> {
  const parsers: Record<string, Parser<SquiggleNode>> = {
    squiggle: squiggleParser,
  };

  const printers: Record<string, Printer<SquiggleNode>> = {
    "squiggle-ast": createSquigglePrinter(util),
  };

  return { languages, parsers, printers, options, defaultOptions };
}
