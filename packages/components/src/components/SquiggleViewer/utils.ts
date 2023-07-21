import {
  PartialPlaygroundSettings,
  PlaygroundSettings,
} from "../PlaygroundSettings.js";
import { SqValue, SqValuePath, PathItem } from "@quri/squiggle-lang";

export type LocalItemSettings = {
  collapsed: boolean;
} & Pick<
  PartialPlaygroundSettings,
  "distributionChartSettings" | "functionChartSettings"
>;

export type MergedItemSettings = PlaygroundSettings;

export function pathAsString(path: SqValuePath) {
  return path.items.join(".");
}

export const pathItemFormat = (item: PathItem) => {
  if (typeof item === "string" || typeof item === "number") {
    return item;
  } else {
    return `table[${item.row}x${item.column}]`;
  }
};

export function pathToShortName(path: SqValuePath): string | undefined {
  const isTopLevel = path.items.length === 0;
  return isTopLevel
    ? { result: undefined, bindings: "Variables" }[path.root]
    : String(pathItemFormat(path.items[path.items.length - 1]));
}

export function getChildrenValues(value: SqValue): SqValue[] {
  switch (value.tag) {
    case "Array":
      return value.value.getValues();
    case "Record":
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
    if (typeof key === "number" && value.tag === "Array") {
      nextValue = value.value.getValues()[key];
    } else if (typeof key === "string" && value.tag === "Record") {
      nextValue = value.value.get(key);
    } else if (typeof key === "object" && value.tag === "TableChart") {
      // Maybe it would be better to get the environment in a different way.
      const environment = context.project.getEnvironment();
      const item = value.value.item(key.row, key.column, environment);
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
