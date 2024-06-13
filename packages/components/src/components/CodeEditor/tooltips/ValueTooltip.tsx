import { EditorView } from "@codemirror/view";
import { FC } from "react";

import { ASTNode, SqValue } from "@quri/squiggle-lang";
import { Button, Dropdown, DropdownMenu } from "@quri/ui";

import { SqValueWithContext, valueHasContext } from "../../../lib/utility.js";
import { SquiggleValueChart } from "../../SquiggleViewer/SquiggleValueChart.js";
import {
  InnerViewerProvider,
  useViewerContext,
} from "../../SquiggleViewer/ViewerProvider.js";
import { ExportUnexportAction } from "./ExportUnexportAction.js";
import { HideAction } from "./HideAction.js";
import { TooltipBox } from "./TooltipBox.js";

export type CommonProps = { value: SqValueWithContext; view: EditorView };
type Props = { value: SqValue; view: EditorView };

export function checkAstType(
  ast: ASTNode
): ast is Extract<ASTNode, { type: "LetStatement" | "DefunStatement" }> {
  return ast.type === "LetStatement" || ast.type === "DefunStatement";
}

const ValueActions: FC<{ value: SqValueWithContext; view: EditorView }> = ({
  value,
  view,
}) => {
  const valueMatchesDoc =
    value.context.runContext.source === view.state.doc.toString();

  if (!valueMatchesDoc) {
    return null; // stale simulation
  }

  return (
    <div className="flex gap-2 px-4 py-2">
      <Dropdown
        render={() => (
          <DropdownMenu>
            <ExportUnexportAction view={view} value={value} />
            <HideAction view={view} value={value} />
          </DropdownMenu>
        )}
        portal={false}
      >
        <Button size="small">Actions</Button>
      </Dropdown>
    </div>
  );
};

export const ValueTooltip: FC<Props> = ({ value, view }) => {
  const { globalSettings } = useViewerContext();

  if (!valueHasContext(value)) {
    return null; // shouldn't happen
  }

  return (
    <TooltipBox view={view}>
      <div className="px-4 py-1">
        {/* Force a standalone ephemeral ViewerProvider, so that we won't sync up collapsed state with the top-level viewer */}
        <InnerViewerProvider
          partialPlaygroundSettings={globalSettings}
          viewerType="tooltip"
          rootValue={value}
        >
          <SquiggleValueChart value={value} settings={globalSettings} />
        </InnerViewerProvider>
      </div>
      <ValueActions view={view} value={value} />
    </TooltipBox>
  );
};
