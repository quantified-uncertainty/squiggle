export { SqProject } from "@quri/squiggle-lang";

export { SquiggleChart } from "./components/SquiggleChart.js";
export { SquiggleViewer } from "./components/SquiggleViewer/index.js";
export { SquiggleEditor } from "./components/SquiggleEditor.js";
export { SquigglePlayground } from "./components/SquigglePlayground/index.js";
export { NumberShower } from "./components/NumberShower.js";
export { ToolbarItem as PlaygroundToolbarItem } from "./components/ui/PanelWithToolbar/ToolbarItem.js";

export { RelativeValueCell } from "./components/RelativeValuesGridChart/RelativeValueCell.js";

// for use in relative values
export {
  useCanvas,
  useCanvasCursor,
  type DrawContext,
} from "./lib/hooks/index.js";

export { drawAxes } from "./lib/draw/index.js";

import {
  scaleLinear,
  scaleLog,
  scaleSymlog,
  scalePow,
} from "./lib/d3/patchedScales.js";

export const d3Extended = {
  scaleLinear,
  scaleLog,
  scaleSymlog,
  scalePow,
};
