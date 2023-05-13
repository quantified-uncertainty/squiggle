import * as standalone from "prettier/standalone";

import { createPlugin } from "./shared.js";

export const { languages, parsers, printers, options, defaultOptions } =
  createPlugin((standalone as any).util);
