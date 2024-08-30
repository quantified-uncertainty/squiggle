export interface FormatterOptions {
  precision?: number;
  forceScientific?: boolean;
}

export type FormattedNumber =
  | { type: "basic"; value: string; isNegative: boolean }
  | {
      type: "scientific";
      mantissa: string;
      exponent: number;
      isNegative: boolean;
    }
  | { type: "unit"; mantissa: string; symbol: string; isNegative: boolean };

// calculatePowerOfTen(2) returns 100
const calculatePowerOfTen = (n: number): number => Math.pow(10, n);

// calculateOrderOfMagnitude(1000) returns 3
const calculateOrderOfMagnitude = (n: number): number =>
  Math.floor(Math.log(Math.abs(n)) / Math.LN10 + 0.000000001);

// formatToSignificantFigures(123.456, 3) returns "123"
const formatToSignificantFigures = (
  number: number,
  sigFigs: number
): string => {
  const withPrecision = number.toPrecision(sigFigs);
  return String(Number(withPrecision));
};

// formatNumberWithScale(1234, 3, 2) returns "1.23"
const formatNumberWithScale = (
  number: number,
  scale: number,
  precision: number
): string => {
  const scaledNumber = number / calculatePowerOfTen(scale);
  return formatToSignificantFigures(scaledNumber, precision);
};

// format(1234567, { precision: 3, forceScientific: true }) returns a FormattedNumber object
export const make = (
  number: number,
  options: FormatterOptions = {}
): FormattedNumber => {
  const { precision = 2, forceScientific = false } = options;
  const absNumber = Math.abs(number);
  const isNegative = number < 0;

  if (isNaN(number)) {
    return { type: "basic", value: "NaN", isNegative: false };
  }

  if (absNumber === 0) {
    return {
      type: "basic",
      value: formatNumberWithScale(0, 0, precision),
      isNegative,
    };
  } else if (absNumber === Infinity) {
    return { type: "basic", value: "Infinity", isNegative };
  }

  const magnitude = calculateOrderOfMagnitude(absNumber);

  if (magnitude > -2 && magnitude < 5) {
    return {
      type: "basic",
      value: formatNumberWithScale(absNumber, 0, precision),
      isNegative,
    };
  } else if (forceScientific || magnitude < -2 || magnitude >= 15) {
    return {
      type: "scientific",
      mantissa: formatNumberWithScale(absNumber, magnitude, precision),
      exponent: magnitude,
      isNegative,
    };
  } else if (magnitude < 6) {
    return {
      type: "unit",
      mantissa: formatNumberWithScale(absNumber, 3, precision),
      symbol: "K",
      isNegative,
    };
  } else if (magnitude < 9) {
    return {
      type: "unit",
      mantissa: formatNumberWithScale(absNumber, 6, precision),
      symbol: "M",
      isNegative,
    };
  } else if (magnitude < 12) {
    return {
      type: "unit",
      mantissa: formatNumberWithScale(absNumber, 9, precision),
      symbol: "B",
      isNegative,
    };
  } else {
    return {
      type: "unit",
      mantissa: formatNumberWithScale(absNumber, 12, precision),
      symbol: "T",
      isNegative,
    };
  }
};

// formattedNumberToString({ type: "scientific", mantissa: "1.23", exponent: 6, isNegative: true }) returns "-1.23e6"
export function toString(formattedNumber: FormattedNumber): string {
  const sign = formattedNumber.isNegative ? "-" : "";
  switch (formattedNumber.type) {
    case "basic":
      return sign + formattedNumber.value;
    case "scientific":
      return `${sign}${formattedNumber.mantissa}e${formattedNumber.exponent}`;
    case "unit":
      return `${sign}${formattedNumber.mantissa}${formattedNumber.symbol}`;
    default:
      throw new Error("Invalid formatted number type");
  }
}

// formatToString(1234567, { precision: 3, forceScientific: true }) returns "1.23e6"
export function makeAndToString(
  number: number,
  options: FormatterOptions = {}
): string {
  const formattedNumber = make(number, options);
  return toString(formattedNumber);
}
