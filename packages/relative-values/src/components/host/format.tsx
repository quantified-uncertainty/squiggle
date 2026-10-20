import { FC } from "react";

import { makeFormattedNumber } from "@quri/squiggle-lang";

import type { RelativeValue } from "../../values/types.js";
import type {
  RelativeValuesFormat,
  RelativeValuesFormatter,
  RelativeValuesLabels,
  RelativeValuesNumberKind,
  RelativeValuesNumberPlace,
} from "./types.js";

export type ResolvedFormat = {
  locale: string | undefined;
  precision: {
    value: number;
    uncertainty: number;
    range: number;
    summary: number;
  };
  uncertainty: "om" | "factor" | "hidden";
  formatNumber: RelativeValuesFormat["formatNumber"];
};

export const defaultResolvedFormat: ResolvedFormat = {
  locale: undefined,
  precision: { value: 1, uncertainty: 2, range: 1, summary: 2 },
  uncertainty: "om",
  formatNumber: undefined,
};

/** Merges `format` field by field over `parent`. */
export function resolveFormat(
  format: RelativeValuesFormat | undefined,
  parent: ResolvedFormat = defaultResolvedFormat
): ResolvedFormat {
  if (!format) {
    return parent;
  }
  return {
    locale: format.locale ?? parent.locale,
    precision: { ...parent.precision, ...format.precision },
    uncertainty: format.uncertainty ?? parent.uncertainty,
    formatNumber: format.formatNumber ?? parent.formatNumber,
  };
}

const superscripts: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "-": "⁻",
};

/** The built-in number formatting, as a string ("1.2", "3.4K", "5·10⁻⁴"). */
export function builtinNumberString(value: number, precision: number): string {
  const formatted = makeFormattedNumber(value, { precision });
  const sign = formatted.isNegative ? "-" : "";
  switch (formatted.type) {
    case "basic":
      return sign + formatted.value;
    case "scientific":
      return `${sign}${formatted.mantissa}·10${String(formatted.exponent)
        .split("")
        .map((char) => superscripts[char] ?? char)
        .join("")}`;
    case "unit":
      return `${sign}${formatted.mantissa}${formatted.symbol}`;
  }
}

export function kindPrecision(
  format: ResolvedFormat,
  kind: RelativeValuesNumberKind,
  place: RelativeValuesNumberPlace
): number {
  if (place === "sidebar") {
    return format.precision.summary;
  }
  switch (kind) {
    case "median":
    case "mean":
      return format.precision.value;
    case "p5":
    case "p95":
      return format.precision.range;
    case "uncertainty":
      return format.precision.uncertainty;
  }
}

export function formatNumberString(
  format: ResolvedFormat,
  value: number,
  kind: RelativeValuesNumberKind,
  place: RelativeValuesNumberPlace,
  precision = kindPrecision(format, kind, place)
): string {
  return (
    format.formatNumber?.(value, { kind, place, precision }) ??
    builtinNumberString(value, precision)
  );
}

/**
 * The displayed uncertainty: half the 90% interval, in orders of magnitude
 * ("om"), or as a multiplicative factor.
 */
export function uncertaintyNumber(
  format: ResolvedFormat,
  value: RelativeValue
): number {
  const half = value.uncertainty / 2;
  return format.uncertainty === "factor" ? 10 ** half : half;
}

export function createFormatter(
  format: ResolvedFormat,
  labels: RelativeValuesLabels,
  place: RelativeValuesNumberPlace = "list"
): RelativeValuesFormatter {
  const number = (value: number, kind: RelativeValuesNumberKind) =>
    formatNumberString(format, value, kind, place);
  return {
    number,
    value: (v) => number(v.median, "median"),
    uncertainty: (v) => {
      switch (format.uncertainty) {
        case "hidden":
          return "";
        case "factor":
          return `×/÷ ${number(uncertaintyNumber(format, v), "uncertainty")}`;
        case "om":
          return `± ${number(uncertaintyNumber(format, v), "uncertainty")} ${labels["cell.uncertaintyUnit"]}`;
      }
    },
    range: (v) => {
      const separator = labels["cell.rangeSeparator"];
      return v.min < 0 && v.max < 0
        ? `-(${number(-v.max, "p95")} ${separator} ${number(-v.min, "p5")})`
        : `${number(v.min, "p5")} ${separator} ${number(v.max, "p95")}`;
    },
  };
}

/**
 * A number, with the host's `formatNumber` if it returns a string, else the
 * built-in formatting (with a real superscript for exponents).
 */
export const FormattedNumber: FC<{
  format: ResolvedFormat;
  value: number;
  kind: RelativeValuesNumberKind;
  place: RelativeValuesNumberPlace;
  precision?: number;
}> = ({ format, value, kind, place, precision: givenPrecision }) => {
  const precision = givenPrecision ?? kindPrecision(format, kind, place);
  const custom = format.formatNumber?.(value, { kind, place, precision });
  if (custom !== undefined) {
    return <span>{custom}</span>;
  }
  const formatted = makeFormattedNumber(value, { precision });
  const sign = formatted.isNegative ? "-" : "";
  switch (formatted.type) {
    case "basic":
      return (
        <span>
          {sign}
          {formatted.value}
        </span>
      );
    case "scientific":
      return (
        <span className="whitespace-nowrap">
          {sign}
          {formatted.mantissa}{" "}
          <span>
            {"·"}10
            <sup style={{ fontSize: "0.7em" }}>{formatted.exponent}</sup>
          </span>
        </span>
      );
    case "unit":
      return (
        <span>
          {sign}
          {formatted.mantissa}
          {formatted.symbol}
        </span>
      );
  }
};
