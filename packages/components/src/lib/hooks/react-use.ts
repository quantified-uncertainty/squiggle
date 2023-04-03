// react-use is broken with ESM, so we re-export the hooks we use here.
// See https://github.com/streamich/react-use/issues/2353 for details.
// (we also could import these directly from "react-use/lib/index.js", but that would increase our bundle size)
import useMeasureImport from "react-use/lib/useMeasure.js";
import useWindowScrollImport from "react-use/lib/useWindowScroll.js";
import useWindowSizeImport from "react-use/lib/useWindowSize.js";
import useUpdateImport from "react-use/lib/useUpdate.js";
import usePreviousImport from "react-use/lib/usePrevious.js";
export const useMeasure = useMeasureImport.default;
export const useWindowScroll = useWindowScrollImport.default;
export const useWindowSize = useWindowSizeImport.default;
export const useUpdate = useUpdateImport.default;
export const usePrevious = usePreviousImport.default;
