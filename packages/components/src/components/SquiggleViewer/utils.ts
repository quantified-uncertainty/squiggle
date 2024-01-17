import isEqual from "lodash/isEqual.js";

import { PathItem, SqDict, SqValue, SqValuePath } from "@quri/squiggle-lang";

import { SHORT_STRING_LENGTH } from "../../lib/constants.js";
import { SqValueWithContext } from "../../lib/utility.js";
import { useViewerContext } from "./ViewerProvider.js";

export const pathItemFormat = (item: PathItem): string => {
  if (item.type === "cellAddress") {
    return `Cell (${item.value.row},${item.value.column})`;
  } else if (item.type === "calculator") {
    return `calculator`;
  } else {
    return String(item.value);
  }
};

function isTopLevel(path: SqValuePath): boolean {
  return path.items.length === 0;
}

const topLevelResultName = "Result";
export const topLevelBindingsName = "Variables";

function topLevelName(path: SqValuePath): string {
  if (path.root === "result") {
    return topLevelResultName;
  } else if (path.root === "bindings") {
    return topLevelBindingsName;
  } else {
    return path.root;
  }
}

export function pathAsString(path: SqValuePath) {
  if (isTopLevel(path)) {
    return topLevelName(path);
  } else {
    return [topLevelName(path), ...path.items.map(pathItemFormat)].join(".");
  }
}

export function pathIsEqual(path1: SqValuePath, path2: SqValuePath) {
  return pathAsString(path1) === pathAsString(path2);
}

export function pathToShortName(path: SqValuePath): string {
  if (isTopLevel(path)) {
    return topLevelName(path);
  } else {
    const lastPathItem = path.items[path.items.length - 1];
    return pathItemFormat(lastPathItem);
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

  return (value: SqValue, path: SqValuePath): SqValue | undefined => {
    const { context } = value;
    if (!context) {
      return;
    }
    if (context.path.root !== path.root) {
      return;
    }
    if (context.path.items.length > path.items.length) {
      return;
    }

    for (let i = 0; i < path.items.length; i++) {
      if (i < context.path.items.length) {
        // check that `path` is a subpath of `context.path`
        if (!isEqual(context.path.items[i], path.items[i])) {
          return;
        }
        continue;
      }

      const pathItem = path.items[i];
      {
        let nextValue: SqValue | undefined;
        if (pathItem.type === "number" && value.tag === "Array") {
          nextValue = value.value.getValues()[pathItem.value];
        } else if (pathItem.type === "string" && value.tag === "Dict") {
          nextValue = value.value.get(pathItem.value);
        } else if (
          pathItem.type === "cellAddress" &&
          value.tag === "TableChart"
        ) {
          // Maybe it would be better to get the environment in a different way.
          const environment = context.project.getEnvironment();
          const item = value.value.item(
            pathItem.value.row,
            pathItem.value.column,
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
            root: path.root,
            items: path.items.slice(0, i),
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
        value = nextValue;
      }
    }
    return value;
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
