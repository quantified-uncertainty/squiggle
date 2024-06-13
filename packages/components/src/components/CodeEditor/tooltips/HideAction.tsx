import { EditorView } from "@codemirror/view";
import { FC, useCallback, useMemo } from "react";

import { ASTNode } from "@quri/squiggle-lang";
import { DropdownMenuActionItem, useCloseDropdown } from "@quri/ui";

import { SqValueWithContext } from "../../../lib/utility.js";
import { checkAstType } from "./ValueTooltip.js";

export const HideAction: FC<{
  value: SqValueWithContext;
  view: EditorView;
}> = ({ value, view }) => {
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

  const closeDropdown = useCloseDropdown();

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
    closeDropdown();
  }, [view, ast, hideDecorator, closeDropdown]);

  return (
    <DropdownMenuActionItem
      title={hideDecorator ? "Unhide" : "Hide"}
      onClick={act}
    />
  );
};
