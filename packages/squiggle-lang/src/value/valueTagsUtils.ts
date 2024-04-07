import { Location, LocationRange } from "../ast/parse.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { Value, vArray, vNumber, vString } from "./index.js";
import { ValueTags } from "./valueTags.js";
import { vDict, type VDict, vDictFromArray } from "./VDict.js";

// There are several value tags functions we can't add to ValueTags because Value is dependent on ValueTags, and that would create a circular dependency.

function locationRangeToValue(locationRange: LocationRange) {
  function locationToDict(location: Location): VDict {
    return vDict(
      ImmutableMap([
        ["line", vNumber(location.line)],
        ["column", vNumber(location.column)],
        ["offset", vNumber(location.offset)],
      ])
    );
  }
  let items: [string, Value][] = [
    ["start", locationToDict(locationRange.start)],
    ["end", locationToDict(locationRange.end)],
  ];
  if (typeof locationRange.source === "string") {
    items = [["source", vString(locationRange.source)], ...items];
  }
  return vDict(ImmutableMap(items));
}

export function exportDataToValue(exportData: {
  sourceId: string;
  path: string[];
}): VDict {
  return vDictFromArray([
    ["sourceId", vString(exportData.sourceId)],
    ["path", vArray(exportData.path.map(vString))],
  ]);
}

export const toList = (tags: ValueTags): [string, Value][] => {
  const result: [string, Value][] = [];
  const { value } = tags;
  if (value.name?.value !== undefined) {
    result.push(["name", value.name]);
  }
  if (value.doc?.value !== undefined) {
    result.push(["doc", value.doc]);
  }
  if (value.showAs !== undefined) {
    result.push(["showAs", value.showAs]);
  }
  if (value.numberFormat !== undefined) {
    result.push(["numberFormat", value.numberFormat]);
  }
  if (value.dateFormat !== undefined) {
    result.push(["dateFormat", value.dateFormat]);
  }
  if (value.hidden !== undefined) {
    result.push(["hidden", value.hidden]);
  }
  if (value.notebook !== undefined) {
    result.push(["notebook", value.notebook]);
  }
  const _exportData = tags.exportData();
  if (_exportData !== undefined) {
    result.push(["exportData", exportDataToValue(_exportData)]);
  }

  if (value.startOpenState !== undefined) {
    result.push(["startOpenState", value.startOpenState]);
  }
  if (value.location !== undefined) {
    result.push(["location", locationRangeToValue(value.location)]);
  }
  if (value.specification !== undefined) {
    result.push(["specification", value.specification]);
  }

  return result;
};

export const toMap = (tags: ValueTags): ImmutableMap<string, Value> => {
  return ImmutableMap(toList(tags));
};

export const toString = (tags: ValueTags): string => {
  return toList(tags)
    .map(([key, value]) => `${key}: ${value.toString()}`)
    .join(", ");
};

export const location = (tags: ValueTags): VDict | undefined => {
  const _location = tags.location();
  return _location ? locationRangeToValue(_location) : undefined;
};

export const exportData = (tags: ValueTags): VDict | undefined => {
  const _exportData = tags.exportData();
  return _exportData ? exportDataToValue(_exportData) : undefined;
};
