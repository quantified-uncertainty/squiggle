import { EditorView } from "@codemirror/view";
import { FC } from "react";

import { SqValue } from "@quri/squiggle-lang";

import { SqValueWithContext, valueHasContext } from "../../../lib/utility.js";
import { SquiggleValueChart } from "../../SquiggleViewer/SquiggleValueChart.js";
import {
  InnerViewerProvider,
  useViewerContext,
} from "../../SquiggleViewer/ViewerProvider.js";
import { ShowType } from "./ShowType.js";
import { TooltipBox } from "./TooltipBox.js";

const ValueAstType: FC<{ value: SqValueWithContext }> = ({ value }) => {
  const ast = value.context.valueAst;
  if (ast.isStatement()) {
    return <ShowType type={ast.variable.type} />;
  } else if (ast.isExpression()) {
    return <ShowType type={ast.type} />;
  } else {
    return null;
  }
};

export const ValueTooltip: FC<{ value: SqValue; view: EditorView }> = ({
  value,
  view,
}) => {
  const { globalSettings } = useViewerContext();

  if (valueHasContext(value)) {
    return (
      <TooltipBox view={view}>
        <div className="px-4 py-1">
          <ValueAstType value={value} />
          {/* Force a standalone ephemeral ViewerProvider, so that we won't sync up collapsed state with the top-level viewer */}
          <InnerViewerProvider
            partialPlaygroundSettings={globalSettings}
            viewerType="tooltip"
            rootValue={value}
          >
            <SquiggleValueChart value={value} settings={globalSettings} />
          </InnerViewerProvider>
        </div>
      </TooltipBox>
    );
  } else {
    return null; // shouldn't happen
  }
};
