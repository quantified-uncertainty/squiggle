import { EditorView } from "@codemirror/view";
import { FC, useCallback } from "react";

import { DropdownMenuActionItem, useCloseDropdown } from "@quri/ui";

import { SqValueWithContext } from "../../../lib/utility.js";
import { checkAstType } from "./ValueTooltip.js";

export const ExportUnexportAction: FC<{
  value: SqValueWithContext;
  view: EditorView;
}> = ({ value, view }) => {
  const ast = value.context.valueAst;

  const closeDropdown = useCloseDropdown();

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
    closeDropdown();
  }, [ast, view]);

  if (!checkAstType(ast) || !value.context.valueAstIsPrecise) {
    return null;
  }
  return (
    <DropdownMenuActionItem
      title={ast.exported ? "Unexport" : "Export"}
      onClick={act}
    />
  );
};
