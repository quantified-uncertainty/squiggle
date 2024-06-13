import { EditorView } from "@codemirror/view";
import { FC, SyntheticEvent, useCallback } from "react";

import { SqValueWithContext, valueHasContext } from "../../../lib/utility.js";
import { SquiggleValueChart } from "../../SquiggleViewer/SquiggleValueChart.js";
import {
  InnerViewerProvider,
  useViewerContext,
} from "../../SquiggleViewer/ViewerProvider.js";
import { TooltipBox } from "./TooltipBox.js";

type Props = { value: SqValueWithContext; view: EditorView };

const ExportUnexportAction: FC<Props> = ({ value, view }) => {
  const ast = value.context.valueAst;

  const toggleExport = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault();
      if (ast.type !== "LetStatement" && ast.type !== "DefunStatement") {
        return;
      }
      if (ast.exported) {
        // can include decorators and ends with "   export   " string
        const text = view.state.sliceDoc(
          ast.location.start.offset,
          ast.variable.location.start.offset
        );
        const match = text.match(/\bexport\s+$/s);
        if (!match || match.index === undefined) {
          return; // TODO - show error?
        }
        view.dispatch({
          changes: {
            from: ast.location.start.offset + match.index,
            to: ast.variable.location.start.offset,
            insert: "",
          },
        });
      } else {
        view.dispatch({
          changes: {
            from: ast.variable.location.start.offset,
            to: ast.variable.location.start.offset,
            insert: "export ",
          },
        });
      }
    },
    [ast, view]
  );

  if (ast.type !== "LetStatement" && ast.type !== "DefunStatement") {
    return null;
  }

  return (
    <a
      href=""
      className="text-xs text-blue-500 hover:underline"
      onClick={toggleExport}
    >
      {ast.exported ? "Unexport" : "Export"}
    </a>
  );
};

const ValueActions: FC<Props> = ({ value, view }) => {
  const valueMatchesDoc =
    value.context.runContext.source === view.state.doc.toString();

  if (!valueMatchesDoc) {
    return null; // stale simulation
  }

  return (
    <div className="px-4 py-2">
      <ExportUnexportAction view={view} value={value} />
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
