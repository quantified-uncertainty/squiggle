import isEqual from "lodash/isEqual.js";

import { SqDict, SqValue, SqValuePath } from "@quri/squiggle-lang";

import { SHORT_STRING_LENGTH } from "../../lib/constants.js";
import { SqValueWithContext } from "../../lib/utility.js";
import { useViewerContext } from "./ViewerProvider.js";

function topLevelName(path: SqValuePath): string {
  return {
    result: "Result",
    bindings: "Variables",
    imports: "Imports",
    exports: "Exports",
  }[path.root];
}

export function pathAsString(path: SqValuePath) {
  return [
    topLevelName(path),
    ...path.items.map((p) => p.toDisplayString()),
  ].join(".");
}

export function pathToShortName(path: SqValuePath): string {
  if (path.isRoot()) {
    return topLevelName(path);
  } else {
    const lastPathItem = path.items[path.items.length - 1];
    return lastPathItem.toDisplayString();
  }
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

// This needs to be a hook because it relies on ItemStore to traverse calculator nodes in path.
export function useGetSubvalueByPath() {
  const { itemStore } = useViewerContext();

  return (
    topValue: SqValue,
    pathToSubvalue: SqValuePath
  ): SqValue | undefined => {
    const { context } = topValue;
    if (!context) {
      return;
    }

    if (!pathToSubvalue.contains(context.path)) {
      return;
    }

    let currentValue = topValue;
    for (let i = 0; i < pathToSubvalue.items.length; i++) {
      if (i < context.path.items.length) {
        // check that `path` is a subpath of `context.path`
        if (!isEqual(context.path.items[i], pathToSubvalue.items[i])) {
          return;
        }
        continue;
      }

      const pathItem = pathToSubvalue.items[i];

      {
        let nextValue: SqValue | undefined;

        if (currentValue.tag === "Array" && pathItem.value.type === "number") {
          nextValue = currentValue.value.getValues()[pathItem.value.value];
        } else if (
          currentValue.tag === "Dict" &&
          pathItem.value.type === "string"
        ) {
          nextValue = currentValue.value.get(pathItem.value.value);
        } else if (
          currentValue.tag === "TableChart" &&
          pathItem.value.type === "cellAddress"
        ) {
          // Maybe it would be better to get the environment in a different way.
          const environment = context.project.getEnvironment();
          const item = currentValue.value.item(
            pathItem.value.value.row,
            pathItem.value.value.column,
            environment
          );
          if (item.ok) {
            nextValue = item.value;
          } else {
            return;
          }
        } else if (pathItem.type === "calculator") {
          // The previous path item is the one that is the parent of the calculator result.
          // This is the one that we use in the ViewerContext to store information about the calculator.
          const calculatorPath = new SqValuePath({
            root: pathToSubvalue.root,
            items: pathToSubvalue.items.slice(0, i),
          });
          const calculatorState = itemStore.getCalculator(calculatorPath);
          const result = calculatorState?.calculatorResult;
          if (!result?.ok) {
            return;
          }
          nextValue = result.value;
        }

        if (!nextValue) {
          return;
        }
        currentValue = nextValue;
      }
    }
    return currentValue;
  };
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
  return Boolean(isHidden === true && path && path.items.length === 1);
}

export function nonHiddenDictEntries(value: SqDict): [string, SqValue][] {
  return value.entries().filter(([_, v]) => !isHidden(v));
}
