export const durationUnits = {
  Millisecond: { ms: 1, name: "ms", plural: "ms" },
  Second: { ms: 1000, name: "second", plural: "seconds" },
  Minute: { ms: 60 * 1000, name: "minute", plural: "minutes" },
  Hour: { ms: 60 * 60 * 1000, name: "hour", plural: "hours" },
  Day: { ms: 24 * 60 * 60 * 1000, name: "day", plural: "days" },
  Year: { ms: 24 * 60 * 60 * 1000 * 365.25, name: "year", plural: "years" },
};

export type DurationUnitName = keyof typeof durationUnits;

export function msToGreatestUnit(msTotal: number): {
  value: number;
  unitName: DurationUnitName;
} {
  for (const unitName of Object.keys(durationUnits)
    .filter((r) => r !== "Millisecond")
    .reverse()) {
    const _unitName = unitName as DurationUnitName;
    const { ms } = durationUnits[_unitName];
    if (Math.abs(msTotal) >= ms) {
      const value = msTotal / ms;
      return { unitName: _unitName, value };
    }
  }
  return { unitName: "Millisecond", value: msTotal };
}

//This is our own internal date duration class. It's used by the interpreter, but meant to act like a simple date library.
export class SDuration {
  constructor(private ms: number) {
    this.ms = ms;
  }

  static fromMs(f: number): SDuration {
    return new SDuration(f);
  }

  static fromMinutes(minutes: number): SDuration {
    return new SDuration(minutes * durationUnits.Minute.ms);
  }

  static fromHours(hours: number): SDuration {
    return new SDuration(hours * durationUnits.Hour.ms);
  }

  static fromDays(days: number): SDuration {
    return new SDuration(days * durationUnits.Day.ms);
  }

  static fromYears(years: number): SDuration {
    return new SDuration(years * durationUnits.Year.ms);
  }

  toMs(): number {
    return this.ms;
  }

  toMinutes(): number {
    return this.ms / durationUnits.Minute.ms;
  }

  toHours(): number {
    return this.ms / durationUnits.Hour.ms;
  }

  toDays(): number {
    return this.ms / durationUnits.Day.ms;
  }

  toYears(): number {
    return this.ms / durationUnits.Year.ms;
  }

  toUnitAndNumber(): { value: number; unitName: DurationUnitName } {
    return msToGreatestUnit(this.ms);
  }

  toString(): string {
    const { unitName, value } = this.toUnitAndNumber();
    const suffix = value !== 1.0 ? durationUnits[unitName].plural : "";
    return `${value.toPrecision(3)} ${suffix}`;
  }

  add(other: SDuration): SDuration {
    return new SDuration(this.ms + other.ms);
  }

  subtract(other: SDuration): SDuration {
    return new SDuration(this.ms - other.ms);
  }

  divideBySDuration(divisor: SDuration): number {
    return this.ms / divisor.toMs();
  }

  divideByNumber(divisor: number): SDuration {
    return new SDuration(this.ms / divisor);
  }

  //Assumes the passed-in number is unitless
  multiply(num: number): SDuration {
    return SDuration.fromMs(this.toMs() * num);
  }

  isEqual(other: SDuration): boolean {
    return this.ms === other.ms;
  }

  smaller(other: SDuration): boolean {
    return this.ms < other.ms;
  }

  larger(other: SDuration): boolean {
    return this.ms > other.ms;
  }
}
