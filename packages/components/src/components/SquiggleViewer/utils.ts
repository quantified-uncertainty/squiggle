import { PathItem, SqValue, SqValuePath } from "@quri/squiggle-lang";

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

export function pathToShortName(path: SqValuePath): string | undefined {
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

  const getCalculatorResult = (pathItem: SqValuePath): SqValue | undefined => {
    // The previous path item is the one that is the parent of the calculator result.
    // This is the one that we use in the ViewerContext to store information about the calculator.
    const allItems = pathItem.itemsAsValuePaths({ includeRoot: true });
    const previousPathItem: SqValuePath | undefined =
      allItems.length > 1 ? allItems[allItems.length - 2] : undefined;

    if (!previousPathItem) {
      return undefined;
    }

    const calculatorState = itemStore.getCalculator(previousPathItem);
    const result = calculatorState?.calculatorResult;
    if (result?.ok) {
      return result.value;
    } else {
      return undefined;
    }
  };

  return (value: SqValue, path: SqValuePath): SqValue | undefined => {
    if (!value.context) {
      return;
    }
    const { context } = value;
    for (const pathItem of path.itemsAsValuePaths({ includeRoot: false })) {
      const key = pathItem.items[pathItem.items.length - 1];
      let nextValue: SqValue | undefined;
      if (key.type === "number" && value.tag === "Array") {
        nextValue = value.value.getValues()[key.value];
      } else if (key.type === "string" && value.tag === "Dict") {
        nextValue = value.value.get(key.value);
      } else if (key.type === "cellAddress" && value.tag === "TableChart") {
        // Maybe it would be better to get the environment in a different way.
        const environment = context.project.getEnvironment();
        const item = value.value.item(
          key.value.row,
          key.value.column,
          environment
        );
        if (item.ok) {
          nextValue = item.value;
        } else {
          return;
        }
      } else if (key.type === "calculator") {
        nextValue = getCalculatorResult(pathItem);
      }
      if (!nextValue) {
        return;
      }
      value = nextValue;
    }
    return value;
  };
}

const tagsDefaultCollapsed = new Set(["Bool", "Number", "Void", "Input"]);

export function hasExtraContentToShow(v: SqValueWithContext): boolean {
  return !(
    tagsDefaultCollapsed.has(v.tag) ||
    (v.tag === "String" && v.value.length <= SHORT_STRING_LENGTH)
  );
}

export const shouldBeginCollapsed = (
  value: SqValueWithContext,
  path: SqValuePath
): boolean => {
  const childrenValues = getChildrenValues(value);
  if (path.isRoot()) {
    return childrenValues.length > 30;
  } else {
    return childrenValues.length > 5 || hasExtraContentToShow(value);
  }
};
