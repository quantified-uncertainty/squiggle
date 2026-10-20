// URL search params <-> state. Pure: never reads `location`.
import { warnOnce } from "../components/host/warn.js";
import { resolveSort, stableStringify } from "./resolve.js";
import {
  defaultRelativeValuesState,
  type RelativeValuesSort,
  type RelativeValuesStateInput,
  type RelativeValuesStateKey,
  relativeValuesStateKeys,
  type RelativeValuesTab,
  relativeValuesTabIds,
} from "./types.js";

export type RelativeValuesSearchParamsInput =
  | URLSearchParams
  | string
  | Readonly<Record<string, string | readonly string[] | undefined>>; // Next.js searchParams

const DEFAULT_PREFIX = "rv.";

function toSearchParams(input: RelativeValuesSearchParamsInput | undefined) {
  if (input === undefined) {
    return new URLSearchParams();
  }
  if (typeof input === "string" || input instanceof URLSearchParams) {
    return new URLSearchParams(input);
  }
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(input)) {
    if (value === undefined) {
      continue;
    }
    // A `readonly string[]` isn't narrowed by `Array.isArray`.
    const values: readonly string[] =
      typeof value === "string" ? [value] : value;
    for (const v of values) {
      params.append(name, v);
    }
  }
  return params;
}

// The params that each key owns, as exact names or name prefixes.
function paramsOf(key: RelativeValuesStateKey, p: string) {
  switch (key) {
    case "view":
      return { names: [`${p}view`] };
    case "unit":
      return { names: [`${p}unit`] };
    case "clusterUnits":
      return { names: [], prefix: `${p}cu.` };
    case "ids":
      return { names: [`${p}ids`] };
    case "clusters":
      return { names: [`${p}cl`] };
    case "search":
      return { names: [`${p}q`] };
    case "sort":
      return { names: [`${p}sort`] };
    case "limit":
      return { names: [`${p}limit`] };
    case "limitBy":
      return { names: [`${p}limitby`] };
    case "columns":
      return {
        names: [
          `${p}cols`,
          `${p}cids`,
          `${p}ccl`,
          `${p}csort`,
          `${p}climit`,
          `${p}climitby`,
        ],
      };
    case "gridMode":
      return { names: [`${p}grid`] };
    case "selectedItem":
      return { names: [`${p}sel`] };
    case "selectedPair":
      return { names: [`${p}pair`] };
  }
}

const encodeSort = (sort: RelativeValuesSort) =>
  `${sort.desc ? "-" : ""}${sort.mode}`;

function decodeSort(value: string | null): RelativeValuesSort | undefined {
  if (value === null) {
    return undefined;
  }
  const desc = value.startsWith("-");
  const mode = desc ? value.slice(1) : value;
  return mode ? { mode, desc } : undefined;
}

function decodeLimit(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }
  const limit = Number(value);
  return limit > 0 && Number.isSafeInteger(limit) ? limit : null;
}

// Repeated params; one empty value is the empty list.
function encodeList(
  params: URLSearchParams,
  name: string,
  list: readonly string[]
) {
  if (list.length === 0) {
    params.append(name, "");
  } else {
    for (const value of list) {
      params.append(name, value);
    }
  }
}

function decodeList(params: URLSearchParams, name: string): string[] | null {
  const values = params.getAll(name);
  if (values.length === 0) {
    return null;
  }
  return values.length === 1 && values[0] === "" ? [] : values;
}

const isDefaultSort = (sort: Partial<RelativeValuesSort> | undefined) =>
  stableStringify(resolveSort(sort)) ===
  stableStringify(defaultRelativeValuesState.sort);

/**
 * Writes state to URL search params. Writes only `keys` (default: all), omits
 * default values, and keeps the other params of `base` (other keys, other
 * prefixes, your own params). Arrays are repeated params, so ids may contain
 * any character.
 */
export function relativeValuesStateToSearchParams(
  state: RelativeValuesStateInput<string>,
  options: {
    prefix?: string;
    keys?: readonly RelativeValuesStateKey[];
    base?: RelativeValuesSearchParamsInput;
    // The view that is omitted from the URL (the default view); defaults to
    // the first of `views`, else "list".
    views?: readonly string[];
  } = {}
): URLSearchParams {
  const p = options.prefix ?? DEFAULT_PREFIX;
  const keys = options.keys ?? relativeValuesStateKeys;
  const params = toSearchParams(options.base);

  for (const key of keys) {
    const { names, prefix } = paramsOf(key, p);
    for (const name of names) {
      params.delete(name);
    }
    if (prefix) {
      for (const name of [...params.keys()]) {
        if (name.startsWith(prefix)) {
          params.delete(name);
        }
      }
    }
  }

  const has = (key: RelativeValuesStateKey) => keys.includes(key);
  const defaultView = options.views?.[0] ?? "list";
  if (
    has("view") &&
    !options.views &&
    state.view !== undefined &&
    !(relativeValuesTabIds as readonly string[]).includes(state.view)
  ) {
    warnOnce(
      `relativeValuesStateToSearchParams: view "${state.view}" isn't a built-in tab; pass the dashboard's tab ids as \`views\` (to the reader too), so that the first one is the default view`
    );
  }

  if (has("view") && state.view !== undefined && state.view !== defaultView) {
    params.set(`${p}view`, state.view);
  }
  if (has("unit") && state.unit) {
    params.set(`${p}unit`, state.unit);
  }
  if (has("clusterUnits") && state.clusterUnits) {
    for (const [cluster, item] of Object.entries(state.clusterUnits)) {
      params.set(`${p}cu.${cluster}`, item);
    }
  }
  if (has("ids") && state.ids) {
    encodeList(params, `${p}ids`, state.ids);
  }
  if (has("clusters") && state.clusters) {
    encodeList(params, `${p}cl`, state.clusters);
  }
  if (has("search") && state.search) {
    params.set(`${p}q`, state.search);
  }
  if (has("sort") && state.sort && !isDefaultSort(state.sort)) {
    params.set(`${p}sort`, encodeSort(resolveSort(state.sort)));
  }
  if (has("limit") && typeof state.limit === "number") {
    params.set(`${p}limit`, String(state.limit));
  }
  if (has("limitBy") && state.limitBy) {
    params.set(`${p}limitby`, encodeSort(resolveSort(state.limitBy)));
  }
  if (has("columns") && state.columns !== undefined) {
    const columns = state.columns;
    if (columns === "rows") {
      params.set(`${p}cols`, "rows");
    } else {
      if (columns.ids) {
        encodeList(params, `${p}cids`, columns.ids);
      }
      if (columns.clusters) {
        encodeList(params, `${p}ccl`, columns.clusters);
      }
      if (columns.sort && !isDefaultSort(columns.sort)) {
        params.set(`${p}csort`, encodeSort(resolveSort(columns.sort)));
      }
      if (typeof columns.limit === "number") {
        params.set(`${p}climit`, String(columns.limit));
      }
      if (columns.limitBy) {
        params.set(`${p}climitby`, encodeSort(resolveSort(columns.limitBy)));
      }
    }
  }
  if (has("gridMode") && state.gridMode && state.gridMode !== "full") {
    params.set(`${p}grid`, state.gridMode);
  }
  if (has("selectedItem") && state.selectedItem) {
    params.set(`${p}sel`, state.selectedItem);
  }
  if (has("selectedPair") && state.selectedPair) {
    params.append(`${p}pair`, state.selectedPair[0]);
    params.append(`${p}pair`, state.selectedPair[1]);
  }
  return params;
}

/**
 * Reads state from URL search params. Returns every key in `keys` (default:
 * all): an absent param gives the default value, so URL-managed keys are
 * always controlled and Back/Forward resets them. Invalid values (e.g.
 * `limit=abc`, a view not in `views`) become the default.
 */
export function relativeValuesStateFromSearchParams<
  View extends string = RelativeValuesTab,
>(
  input: RelativeValuesSearchParamsInput,
  options: {
    prefix?: string;
    keys?: readonly RelativeValuesStateKey[];
    // Default: the built-in tabs; other values are dropped. The first one is
    // the default view.
    views?: readonly View[];
  } = {}
): RelativeValuesStateInput<View> {
  const p = options.prefix ?? DEFAULT_PREFIX;
  const keys = options.keys ?? relativeValuesStateKeys;
  const params = toSearchParams(input);
  // Without `views`, View is the built-in tab union.
  const views = (options.views ?? relativeValuesTabIds) as readonly View[];
  const state: RelativeValuesStateInput<View> = {};

  for (const key of keys) {
    switch (key) {
      case "view": {
        const view = params.get(`${p}view`);
        state.view = views.find((v) => v === view) ?? views[0];
        break;
      }
      case "unit":
        state.unit = params.get(`${p}unit`) || null;
        break;
      case "clusterUnits": {
        const clusterUnits: Record<string, string> = {};
        for (const [name, value] of params) {
          if (name.startsWith(`${p}cu.`) && value) {
            clusterUnits[name.slice(`${p}cu.`.length)] = value;
          }
        }
        state.clusterUnits = clusterUnits;
        break;
      }
      case "ids":
        state.ids = decodeList(params, `${p}ids`);
        break;
      case "clusters":
        state.clusters = decodeList(params, `${p}cl`);
        break;
      case "search":
        state.search = params.get(`${p}q`) ?? "";
        break;
      case "sort":
        state.sort =
          decodeSort(params.get(`${p}sort`)) ?? defaultRelativeValuesState.sort;
        break;
      case "limit":
        state.limit = decodeLimit(params.get(`${p}limit`));
        break;
      case "limitBy":
        state.limitBy = decodeSort(params.get(`${p}limitby`)) ?? null;
        break;
      case "columns": {
        if (params.get(`${p}cols`) === "rows") {
          state.columns = "rows";
        } else {
          state.columns = {
            ids: decodeList(params, `${p}cids`),
            clusters: decodeList(params, `${p}ccl`),
            sort:
              decodeSort(params.get(`${p}csort`)) ??
              defaultRelativeValuesState.sort,
            limit: decodeLimit(params.get(`${p}climit`)),
            limitBy: decodeSort(params.get(`${p}climitby`)) ?? null,
          };
        }
        break;
      }
      case "gridMode":
        state.gridMode = params.get(`${p}grid`) === "half" ? "half" : "full";
        break;
      case "selectedItem":
        state.selectedItem = params.get(`${p}sel`) || null;
        break;
      case "selectedPair": {
        const pair = params.getAll(`${p}pair`);
        state.selectedPair =
          pair.length === 2 && pair[0] && pair[1] ? [pair[0], pair[1]] : null;
        break;
      }
    }
  }
  return state;
}
