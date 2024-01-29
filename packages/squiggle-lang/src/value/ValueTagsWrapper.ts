import { Location, LocationRange } from "peggy";

import { ImmutableMap } from "../utility/immutableMap.js";
import { Value, vNumber, vString } from "./index.js";
import { ValueTags } from "./valueTags.js";
import { vDict, type VDict } from "./VDict.js";

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

// This class is meant for functions that depend on Value. BaseValue depends on ValueTags, so we can't call many functions there. Instead, we call them here.
export class ValueTagsWrapper {
  constructor(public value: ValueTags) {}

  toList(): [string, Value][] {
    const result: [string, Value][] = [];
    const { value } = this.value;
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
    const _exportData = this.value.exportData();
    if (_exportData !== undefined) {
      result.push(["exportData", _exportData]);
    }

    if (value.startOpenState !== undefined) {
      result.push(["startOpenState", value.startOpenState]);
    }
    if (value.location !== undefined) {
      result.push(["location", locationRangeToValue(value.location)]);
    }

    return result;
  }

  toMap(): ImmutableMap<string, Value> {
    return ImmutableMap(this.toList());
  }

  toString(): string {
    return this.toList()
      .map(([key, value]) => `${key}: ${value.toString()}`)
      .join(", ");
  }
  location(): VDict | undefined {
    const _location = this.value.location();
    return _location ? locationRangeToValue(_location) : undefined;
  }
}
