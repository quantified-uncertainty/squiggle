// react-use is broken with ESM, so we re-export the hooks we use here.
// See https://github.com/streamich/react-use/issues/2353 for details.
// (we also could import these directly from "react-use/lib/index.js", but that would increase our bundle size)
import useWindowScrollImport from "react-use/lib/useWindowScroll.js";
import useWindowSizeImport from "react-use/lib/useWindowSize.js";

function cjsHack<T>(v: { default: T }) {
  // this can happen in jest environment, TODO - investigate
  if (v.default) {
    return v.default as T;
  }

  return v as T;
}

export const useWindowScroll = cjsHack(useWindowScrollImport);
export const useWindowSize = cjsHack<
  // explicit type because of "cannot be named" error
  (arg?: {
    initialWidth?: number;
    initialHeight?: number;
    onChange?: (width: number, height: number) => void;
  }) => {
    width: number;
    height: number;
  }
>(useWindowSizeImport);
