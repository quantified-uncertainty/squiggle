import type { BundleNumber, RelativeValuesBundle } from "./bundle.js";

export const RELATIVE_VALUES_CSV_METRICS = [
  "median",
  "mean",
  "min",
  "max",
  "uncertainty",
] as const;

export type RelativeValuesCsvMetric =
  (typeof RELATIVE_VALUES_CSV_METRICS)[number];

export type RelativeValuesCsvOptions = {
  // The number in each cell of the wide matrix; defaults to "median". `min`
  // and `max` are p5 and p95.
  metric?: RelativeValuesCsvMetric;
  // Tidy rows `row,col,median,mean,min,max,uncertainty,error` (one per pair)
  // instead of the wide matrix.
  long?: boolean;
};

// The cell of a failed comparison in the wide matrix.
export const RELATIVE_VALUES_CSV_ERROR = "ERR";

// RFC 4180 quoting: fields with a comma, a quote or a line break are quoted,
// and quotes are doubled.
function field(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function line(fields: string[]): string {
  return fields.map(field).join(",");
}

// Numbers as in the bundle (rounded there with `precision`); non-finite
// numbers are "Infinity", "-Infinity" and "NaN".
function numberField(value: BundleNumber): string {
  return String(value);
}

/**
 * A bundle's pairs as CSV (with a trailing newline).
 *
 * - Wide (default): the header row is an empty cell followed by the item ids
 *   (columns); each following row starts with an item id and holds the
 *   `metric` of that row's item in terms of each column's item. Failed
 *   comparisons are `ERR`.
 * - Long (`long: true`): `row,col,median,mean,min,max,uncertainty,error`, one
 *   line per pair; failed comparisons have empty numbers and the error message.
 *
 * Items are in definition order.
 */
export function relativeValuesBundleToCsv(
  bundle: RelativeValuesBundle,
  options: RelativeValuesCsvOptions = {}
): string {
  const metric = options.metric ?? "median";
  if (!RELATIVE_VALUES_CSV_METRICS.includes(metric)) {
    throw new Error(
      `Unknown metric "${metric}"; expected one of ${RELATIVE_VALUES_CSV_METRICS.join(", ")}`
    );
  }
  const values = new Map<string, RelativeValuesBundle["pairs"][number][2]>();
  for (const [id1, id2, value] of bundle.pairs) {
    values.set(`${id1}\0${id2}`, value);
  }
  const ids = bundle.definition.items.map((item) => item.id);
  const lines: string[] = [];

  if (options.long) {
    lines.push(line(["row", "col", ...RELATIVE_VALUES_CSV_METRICS, "error"]));
    for (const row of ids) {
      for (const col of ids) {
        const value = values.get(`${row}\0${col}`);
        if (!value) {
          lines.push(line([row, col, "", "", "", "", "", "missing"]));
        } else if ("error" in value) {
          lines.push(line([row, col, "", "", "", "", "", value.error]));
        } else {
          lines.push(
            line([
              row,
              col,
              ...RELATIVE_VALUES_CSV_METRICS.map((m) => numberField(value[m])),
              "",
            ])
          );
        }
      }
    }
  } else {
    lines.push(line(["", ...ids]));
    for (const row of ids) {
      const cells = ids.map((col) => {
        const value = values.get(`${row}\0${col}`);
        return !value || "error" in value
          ? RELATIVE_VALUES_CSV_ERROR
          : numberField(value[metric]);
      });
      lines.push(line([row, ...cells]));
    }
  }
  return lines.join("\n") + "\n";
}
