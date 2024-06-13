import { EditorView } from "@codemirror/view";
import { FC, useCallback, useMemo } from "react";

import { ASTNode, SqValue } from "@quri/squiggle-lang";

import { SqValueWithContext, valueHasContext } from "../../../lib/utility.js";
import { SquiggleValueChart } from "../../SquiggleViewer/SquiggleValueChart.js";
import {
  InnerViewerProvider,
  useViewerContext,
} from "../../SquiggleViewer/ViewerProvider.js";
import { TooltipBox } from "./TooltipBox.js";

type CommonProps = { value: SqValueWithContext; view: EditorView };
type Props = { value: SqValue; view: EditorView };

function checkAstType(
  ast: ASTNode
): ast is Extract<ASTNode, { type: "LetStatement" | "DefunStatement" }> {
  return ast.type === "LetStatement" || ast.type === "DefunStatement";
}

const TooltipAction: FC<{ act: () => void; text: string }> = ({
  act,
  text,
}) => {
  return (
    <a
      href=""
      className="text-xs text-blue-500 hover:underline"
      onClick={(e) => {
        e.preventDefault();
        act();
      }}
    >
      {text}
    </a>
  );
};

const ExportUnexportAction: FC<CommonProps> = ({ value, view }) => {
  const ast = value.context.valueAst;

  const act = useCallback(() => {
    if (!checkAstType(ast)) {
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
  }, [ast, view]);

  if (!checkAstType(ast) || !value.context.valueAstIsPrecise) {
    return null;
  }

  return (
    <TooltipAction act={act} text={ast.exported ? "Unexport" : "Export"} />
  );
};

const HideAction: FC<CommonProps> = ({ value, view }) => {
  const ast = value.context.valueAst;

  const hideDecorator = useMemo<ASTNode | undefined>(() => {
    if (!checkAstType(ast)) {
      return;
    }
    for (const decorator of ast.decorators) {
      if (decorator.name.value === "hide") {
        return decorator;
      }
    }
  }, [ast]);

  const act = useCallback(() => {
    if (!checkAstType(ast)) {
      return;
    }

    if (hideDecorator) {
      view.dispatch({
        changes: {
          from: hideDecorator.location.start.offset,
          to: hideDecorator.location.end.offset,
          insert: "",
        },
      });
    } else {
      view.dispatch({
        changes: {
          from: ast.location.start.offset,
          to: ast.location.start.offset,
          insert: "@hide\n",
        },
      });
    }
  }, [view, ast, hideDecorator]);

  return <TooltipAction act={act} text={hideDecorator ? "Unhide" : "Hide"} />;
};

const ValueActions: FC<CommonProps> = ({ value, view }) => {
  const valueMatchesDoc =
    value.context.runContext.source === view.state.doc.toString();

  if (!valueMatchesDoc) {
    return null; // stale simulation
  }

  return (
    <div className="flex gap-2 px-4 py-2">
      <ExportUnexportAction view={view} value={value} />
      <HideAction view={view} value={value} />
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
