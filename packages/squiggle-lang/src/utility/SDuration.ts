export const durationUnits = {
  Second: 1000,
  Minute: 60 * 1000,
  Hour: 60 * 60 * 1000,
  Day: 24 * 60 * 60 * 1000,
  Year: 24 * 60 * 60 * 1000 * 365.25,
} as const;

//This is our own internal date duration class. It's used by the interpreter, but meant to act like a simple date library.
export class SDuration {
  constructor(private ms: number) {
    this.ms = ms;
  }

  static fromMs(f: number): SDuration {
    return new SDuration(f);
  }

  static fromMinutes(minutes: number): SDuration {
    return new SDuration(minutes * durationUnits.Minute);
  }

  static fromHours(hours: number): SDuration {
    return new SDuration(hours * durationUnits.Hour);
  }

  static fromDays(days: number): SDuration {
    return new SDuration(days * durationUnits.Day);
  }

  static fromYears(years: number): SDuration {
    return new SDuration(years * durationUnits.Year);
  }

  toMs(): number {
    return this.ms;
  }

  toMinutes(): number {
    return this.ms / durationUnits.Minute;
  }

  toHours(): number {
    return this.ms / durationUnits.Hour;
  }

  toDays(): number {
    return this.ms / durationUnits.Day;
  }

  toYears(): number {
    return this.ms / durationUnits.Year;
  }

  toUnitAndNumber(): { value: number; unitName: string } {
    const units: [number, string][] = [
      [durationUnits.Year, "year"],
      [durationUnits.Day, "day"],
      [durationUnits.Hour, "hour"],
      [durationUnits.Minute, "minute"],
      [durationUnits.Second, "second"],
    ];

    for (const [unitValue, unitName] of units) {
      if (Math.abs(this.ms) >= unitValue) {
        const value = this.ms / unitValue;
        return { unitName, value };
      }
    }
    return { unitName: "ms", value: this.ms };
  }

  toString(): string {
    const { unitName, value } = this.toUnitAndNumber();
    const suffix = value !== 1.0 ? "s" : "";
    return `${value.toPrecision(3)} ${unitName}${suffix}`;
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
