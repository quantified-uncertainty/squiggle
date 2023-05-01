import { util } from "prettier";

import { type PrettierUtil, createPlugin } from "./shared.js";
export { type Node } from "./shared.js";

export const { languages, parsers, printers, options, defaultOptions } =
  createPlugin(util as unknown as PrettierUtil);
