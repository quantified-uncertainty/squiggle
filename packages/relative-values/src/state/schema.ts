import { z } from "zod";

import {
  type RelativeValuesStateInput,
  type RelativeValuesStateKey,
  relativeValuesStateKeys,
  type RelativeValuesTab,
  relativeValuesTabIds,
} from "./types.js";

const sortSchema = z.object({
  mode: z.string().optional(),
  desc: z.boolean().optional(),
});

const idsSchema = z.array(z.string()).nullable();

// One schema per key, so that an invalid key doesn't invalidate the others.
const keySchemas = {
  view: z.string(),
  unit: z.string().nullable(),
  clusterUnits: z.record(z.string()),
  ids: idsSchema,
  clusters: idsSchema,
  search: z.string(),
  sort: sortSchema,
  limit: z.number().nullable(),
  limitBy: sortSchema.nullable(),
  columns: z.union([
    z.literal("rows"),
    z.object({
      ids: idsSchema.optional(),
      clusters: idsSchema.optional(),
      sort: sortSchema.optional(),
      limit: z.number().nullable().optional(),
      limitBy: sortSchema.nullable().optional(),
    }),
  ]),
  gridMode: z.enum(["full", "half"]),
  selectedItem: z.string().nullable(),
  selectedPair: z.tuple([z.string(), z.string()]).nullable(),
} satisfies Record<RelativeValuesStateKey, z.ZodTypeAny>;

const isStateKey = (key: string): key is RelativeValuesStateKey =>
  (relativeValuesStateKeys as readonly string[]).includes(key);

function assign<K extends RelativeValuesStateKey>(
  state: RelativeValuesStateInput<string>,
  key: K,
  value: RelativeValuesStateInput<string>[K]
) {
  state[key] = value;
}

/**
 * Validates saved state (e.g. from localStorage). Lenient: invalid fields are
 * dropped with a warning; never throws. Ids aren't checked against a
 * definition here; dashboards ignore unknown ids (see the README).
 *
 * `view` is checked against `views` (default: the built-in tabs, as in
 * `relativeValuesStateFromSearchParams`); pass your tab ids if you have
 * custom tabs.
 */
export function parseRelativeValuesState<
  View extends string = RelativeValuesTab,
>(
  json: unknown,
  options: { views?: readonly View[] } = {}
): { state: RelativeValuesStateInput<View>; warnings: string[] } {
  // Without `views`, View is the built-in tab union.
  const views = (options.views ?? relativeValuesTabIds) as readonly string[];
  const warnings: string[] = [];
  if (json === null || json === undefined) {
    return { state: {}, warnings };
  }
  if (typeof json !== "object" || Array.isArray(json)) {
    warnings.push("Relative values state must be an object");
    return { state: {}, warnings };
  }
  const state: RelativeValuesStateInput<string> = {};
  for (const [key, value] of Object.entries(json)) {
    if (!isStateKey(key)) {
      warnings.push(`Unknown state key "${key}" ignored`);
      continue;
    }
    if (value === undefined) {
      continue;
    }
    const parsed = keySchemas[key].safeParse(value);
    if (!parsed.success) {
      warnings.push(`Invalid state key "${key}" ignored`);
      continue;
    }
    if (key === "view" && !views.some((view) => view === parsed.data)) {
      warnings.push(`Unknown view "${String(parsed.data)}" ignored`);
      continue;
    }
    // The schema of each key matches its input type.
    assign(
      state,
      key,
      parsed.data as RelativeValuesStateInput<string>[typeof key]
    );
  }
  // `view` was checked against `views` above.
  return { state: state as RelativeValuesStateInput<View>, warnings };
}
