import {
  scaleLinear,
  scaleLog,
  scalePow,
  scaleSymlog,
} from "./lib/d3/patchedScales.js";

export { SqProject } from "@quri/squiggle-lang";

export { NumberShower } from "./components/ui/NumberShower.js";
export {
  SquiggleChart,
  type SquiggleChartProps,
} from "./components/SquiggleChart.js";
export { SquiggleEditor } from "./components/SquiggleEditor.js";
export {
  CodeEditor,
  type CodeEditorHandle,
  type CodeEditorProps,
} from "./components/CodeEditor/index.js";
export {
  SquigglePlayground,
  type SquigglePlaygroundProps,
} from "./components/SquigglePlayground/index.js";
export { SquiggleViewer } from "./components/SquiggleViewer/index.js";
export { ViewerWithMenuBar } from "./components/ViewerWithMenuBar/index.js";
export { ProjectContext } from "./components/ProjectProvider.js";
export { type Simulation, useSimulator } from "./lib/hooks/useSimulator.js";
export { ToolbarItem as PlaygroundToolbarItem } from "./components/ui/PanelWithToolbar/ToolbarItem.js";
export { FnDocumentationFromName } from "./components/ui/FnDocumentation.js";

export { SquiggleErrorAlert } from "./components/ui/SquiggleErrorAlert.js";

export { RelativeValueCell } from "./widgets/PlotWidget/RelativeValuesGridChart/RelativeValueCell.js";

export { MarkdownViewer } from "./lib/MarkdownViewer.js";
export { CodeSyntaxHighlighter } from "./lib/CodeSyntaxHighlighter.js";

// for use in relative values
export {
  type DrawContext,
  useCanvas,
  useCanvasCursor,
} from "./lib/hooks/index.js";

export { drawAxes } from "./lib/draw/index.js";

export const d3Extended = {
  scaleLinear,
  scaleLog,
  scaleSymlog,
  scalePow,
};

export { ProjectStateViewer } from "./components/ProjectStateViewer/index.js";
