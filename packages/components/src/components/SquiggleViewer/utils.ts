import { PathItem, SqValue, SqValuePath } from "@quri/squiggle-lang";
import {
  PartialPlaygroundSettings,
  PlaygroundSettings,
} from "../PlaygroundSettings.js";

export type LocalItemSettings = {
  collapsed: boolean;
} & Pick<
  PartialPlaygroundSettings,
  "distributionChartSettings" | "functionChartSettings"
>;

export type MergedItemSettings = PlaygroundSettings;

export const pathItemFormat = (item: PathItem): string => {
  if (item.type === "cellAddress") {
    return `Cell (${item.value.row},${item.value.column})`;
  } else {
    return String(item.value);
  }
};

export function pathAsString(path: SqValuePath) {
  const isTopLevel = path.items.length === 0;
  if (isTopLevel && path.root === "result") {
    return "Result";
  } else if (isTopLevel && path.root === "bindings") {
    return "Variables";
  } else {
    return "Variables." + path.items.map(pathItemFormat).join(".");
  }
}

export function pathToShortName(path: SqValuePath): string | undefined {
  const isTopLevel = path.items.length === 0;
  if (isTopLevel && path.root === "result") {
    return "Result";
  } else if (isTopLevel && path.root === "bindings") {
    return "Variables";
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

export function extractSubvalueByPath(
  value: SqValue,
  path: SqValuePath
): SqValue | undefined {
  if (!value.context) {
    return;
  }
  const { context } = value;

  for (const key of path.items) {
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
    }
    if (!nextValue) {
      return;
    }
    value = nextValue;
  }
  return value;
}
