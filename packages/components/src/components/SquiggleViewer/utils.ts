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
  if (item.type === "coords") {
    return `table[${item.value.row}x${item.value.column}]`;
  } else {
    return String(item);
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
    if (key.type === "number" && value.tag === "Array") {
      nextValue = value.value.getValues()[key.value];
    } else if (key.type === "string" && value.tag === "Record") {
      nextValue = value.value.get(key.value);
    } else if (key.type === "coords" && value.tag === "TableChart") {
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
