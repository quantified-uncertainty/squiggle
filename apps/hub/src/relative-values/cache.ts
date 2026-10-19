import {
  InMemoryRelativeValuesCache,
  makePairKey,
  RelativeValueResult,
  relativeValueSchema,
} from "@quri/squiggle-relative-values/core";

import { RelativeValuesExportFullDTO } from "./data/fullExport";

/**
 * Build a ModelEvaluator cache prefilled with pairs stored in the database
 * (`RelativeValuesPairCache` rows). Pairs that are not in the database are
 * computed on the client and kept in memory.
 */
export function createRelativeValuesCacheFromDTO(
  rows: RelativeValuesExportFullDTO["cache"]
): InMemoryRelativeValuesCache {
  return new InMemoryRelativeValuesCache(
    rows.map((row): [string, RelativeValueResult] => [
      makePairKey(row.firstItem, row.secondItem),
      row.errorString === null
        ? {
            ok: true,
            value: relativeValueSchema.parse(JSON.parse(row.resultJSON)),
          }
        : { ok: false, value: row.errorString },
    ])
  );
}
