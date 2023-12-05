export const _units = {
  ms: 1,
  second: 1000,
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  year: 24 * 60 * 60 * 1000 * 365.25,
} as const;

// Derive Unit type from the keys of durationUnits
export type DurationUnit = keyof typeof _units;

// Derive units array from durationUnits
export const units: DurationUnit[] = Object.keys(_units) as DurationUnit[];

export class Duration {
  constructor(
    public value: number,
    public unit: DurationUnit
  ) {
    this.value = value;
    this.unit = unit;
  }

  static toUnitConversionFactor(
    oldUnit: DurationUnit,
    newUnit: DurationUnit
  ): number {
    return _units[newUnit] / _units[oldUnit];
  }

  toUnit(newUnit: DurationUnit): Duration {
    return new Duration(
      this.value * Duration.toUnitConversionFactor(this.unit, newUnit),
      newUnit
    );
  }

  toGreatestUnit(): Duration {
    const ms = this.toUnit("ms").value;

    for (const unit of [...units].reverse()) {
      const unitValue = _units[unit];
      if (Math.abs(ms) >= unitValue) {
        const value = ms / unitValue;
        return new Duration(value, unit);
      }
    }

    return new Duration(ms, "ms");
  }

  toUnitString(): string {
    if (this.unit === "ms") {
      return `ms`;
    } else {
      return `${this.unit}s`;
    }
  }

  toString(precision = 2): string {
    return `${this.value.toPrecision(precision)} ${this.toUnitString()}`;
  }
}
