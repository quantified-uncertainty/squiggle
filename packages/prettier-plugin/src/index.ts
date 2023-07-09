import { util } from "prettier";

import { createPlugin } from "./shared.js";
import { type PrettierUtil } from "./types.js";

export const { languages, parsers, printers, options, defaultOptions } =
  createPlugin(util as unknown as PrettierUtil);
