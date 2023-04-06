// react-use is broken with ESM, so we re-export the hooks we use here.
// See https://github.com/streamich/react-use/issues/2353 for details.
// (we also could import these directly from "react-use/lib/index.js", but that would increase our bundle size)
import { default as useMeasureImport } from "react-use/lib/useMeasure.js";
import { default as useWindowScrollImport } from "react-use/lib/useWindowScroll.js";
import { default as useWindowSizeImport } from "react-use/lib/useWindowSize.js";
import { default as useUpdateImport } from "react-use/lib/useUpdate.js";
import { default as usePreviousImport } from "react-use/lib/usePrevious.js";

function cjsHack<T>(v: { default: T }) {
  // this can happen in jest environment, TODO - investigate
  if ((v as any).default) {
    return (v as any).default as T;
  }

  return v as any as T;
}

export const useMeasure = cjsHack(useMeasureImport);
export const useWindowScroll = cjsHack(useWindowScrollImport);
export const useWindowSize = cjsHack(useWindowSizeImport);
export const useUpdate = cjsHack(useUpdateImport);
export const usePrevious = cjsHack(usePreviousImport);
