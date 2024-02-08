import includes from "lodash/includes.js";
import uniq from "lodash/uniq.js";
import uniqBy from "lodash/uniqBy.js";

import { ASTNode, SqDict, SqValue, SqValuePath } from "@quri/squiggle-lang";

import { SqOutputResult } from "../../../../squiggle-lang/src/public/types.js";
import { SHORT_STRING_LENGTH } from "../../lib/constants.js";
import { SqValueWithContext } from "../../lib/utility.js";
import { ItemStore, useViewerContext } from "./ViewerProvider.js";

function topLevelName(path: SqValuePath): string {
  return {
    result: "Result",
    bindings: "Variables",
    imports: "Imports",
    exports: "Exports",
  }[path.root];
}

export function pathToDisplayString(path: SqValuePath) {
  return [
    topLevelName(path),
    ...path.edges.map((p) => p.toDisplayString()),
  ].join(".");
}

export function pathToShortName(path: SqValuePath): string {
  //topLevelName is used if its the root path
  return path.lastItem()?.toDisplayString() || topLevelName(path);
}

export function getChildrenValues(value: SqValue): SqValue[] {
  switch (value.tag) {
    case "Array":
      return value.value.getValues();
    case "Dict":
      return value.value.entries().map((a) => a[1]);
    default: {
      return [];
    }
  }
}

export type TraverseCalculatorEdge = (path: SqValuePath) => SqValue | undefined;

export function traverseCalculatorEdge(
  itemStore: ItemStore
): TraverseCalculatorEdge {
  return (calculatorSubPath: SqValuePath) => {
    const calculatorState = itemStore.getCalculator(calculatorSubPath);
    const result = calculatorState?.calculatorResult;
    return result?.ok ? result.value : undefined;
  };
}

// This needs to be a hook because it relies on ItemStore to traverse calculator nodes in path.
export function useGetSubvalueByPath() {
  const { itemStore } = useViewerContext();

  return (topValue: SqValue, subValuePath: SqValuePath): SqValue | undefined =>
    topValue.getSubvalueByPath(subValuePath, traverseCalculatorEdge(itemStore));
}

export function getValueComment(value: SqValueWithContext): string | undefined {
  const _value = value.context.docstring() || value.tags.doc();
  return _value && _value.length > 0 ? _value : undefined;
}

const tagsDefaultCollapsed = new Set(["Bool", "Number", "Void", "Input"]);

export function hasExtraContentToShow(v: SqValueWithContext): boolean {
  const contentIsVeryShort =
    tagsDefaultCollapsed.has(v.tag) ||
    (v.tag === "String" && v.value.length <= SHORT_STRING_LENGTH);
  const comment = getValueComment(v);
  const hasLongComment = Boolean(comment && comment.length > 15);
  return !contentIsVeryShort || hasLongComment;
}

// Collapse children and element if desired. Uses crude heuristics.
export const shouldBeginCollapsed = (
  value: SqValueWithContext,
  path: SqValuePath
): boolean => {
  const startOpenState = value.tags.startOpenState();
  if (startOpenState === "open") {
    return false;
  } else if (startOpenState === "closed") {
    return true;
  }
  const childrenValues = getChildrenValues(value);
  if (path.isRoot()) {
    return childrenValues.length > 30;
  } else if (value.tag === "Dist") {
    return true;
  } else {
    return childrenValues.length > 5 || !hasExtraContentToShow(value);
  }
};

//We only hide tagged=hidden values, if they are first-level in Variables.
function isHidden(value: SqValue): boolean {
  const isHidden = value.tags.hidden();
  const path = value.context?.path;
  return Boolean(isHidden === true && path && path.edges.length === 1);
}

export function nonHiddenDictEntries(value: SqDict): [string, SqValue][] {
  return value.entries().filter(([_, v]) => !isHidden(v));
}

function valueToLine(value: SqValue): number | undefined {
  return value.context?.findLocation()?.start.line;
}

export function findValuePathByLine(
  line: number,
  sqResult?: SqOutputResult
): { type: "Imports" | "Variables" | "Result"; path: SqValuePath } | undefined {
  if (!sqResult?.ok) {
    return undefined;
  }
  const { imports, bindings, result } = sqResult.value;

  function allChildren(value: SqValue): SqValue[] {
    return getChildrenValues(value).flatMap((v) => [v, ...allChildren(v)]);
  }

  // Search in bindings
  for (const value of allChildren(bindings.asValue())) {
    if (line === valueToLine(value) && value.context?.path) {
      return { type: "Variables", path: value.context.path };
    }
  }

  for (const value of allChildren(imports.asValue())) {
    if (line === valueToLine(value) && value.context?.path) {
      return { type: "Imports", path: value.context.path };
    }
  }

  // Check in result
  const resultLine = valueToLine(result);
  if (line === resultLine && result.context?.path) {
    return { type: "Result", path: result.context.path };
  }
}

function lastUniqBy<A, B>(arr: A[], fn: (a: A) => B): A[] {
  return uniqBy(arr.reverse(), fn).reverse();
}

function astChildren(node: ASTNode): ASTNode[] {
  switch (node.type) {
    case "Dict":
      // Assuming 'elements' is an array of { key: ASTNode, value: ASTNode | string }
      // and we only want to include ASTNode values
      return node.elements.flatMap((e) =>
        typeof e.value === "string" ? [] : [e.value]
      );
    case "Array":
      return node.elements;
    case "Block": {
      const lastNode = node.statements.at(-1);
      return lastNode ? [lastNode] : [];
    }
    case "LetStatement":
      return [node.value];
    case "DecoratedStatement":
      return [node.statement];
    case "Program": {
      return lastUniqBy(node.statements, (s) => {
        switch (s.type) {
          case "LetStatement":
            return s.variable.value;
          case "Identifier":
            return s.value;
          default:
            return s;
        }
      });
    }
    default:
      return [];
  }
}

//Check for Defun and Decorator statements

function astAllChildren(node: ASTNode): ASTNode[] {
  return [node, ...astChildren(node).flatMap(astAllChildren)];
}

export function getActiveLineNumbers(sqResult?: SqOutputResult): number[] {
  if (!sqResult?.ok) {
    return [];
  }
  const ast = sqResult.value.bindings.context?.ast;
  if (!ast) {
    return [];
  }
  const values = uniq(
    astAllChildren(ast)
      .filter((p) =>
        includes(
          ["LetStatement", "DefunStatement", "Block", "Dict", "Identifier"],
          p.type
        )
      )
      .map((s) => s.location.start.line - 1)
  );
  return values;
}
