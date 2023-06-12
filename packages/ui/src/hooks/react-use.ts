// react-use is broken with ESM, so we re-export the hooks we use here.
// See https://github.com/streamich/react-use/issues/2353 for details.
// (we also could import these directly from "react-use/lib/index.js", but that would increase our bundle size)
import { default as useWindowScrollImport } from "react-use/lib/useWindowScroll.js";
import { default as useWindowSizeImport } from "react-use/lib/useWindowSize.js";

function cjsHack<T>(v: { default: T }) {
  // this can happen in jest environment, TODO - investigate
  if (v.default) {
    return v.default as T;
  }

  return v as T;
}

export const useWindowScroll = cjsHack(useWindowScrollImport);
export const useWindowSize = cjsHack(useWindowSizeImport);
