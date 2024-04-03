export class NumberSet {
  public readonly numbers: number[];
  public readonly set: Set<number>;

  constructor(numbers: readonly number[]) {
    this.set = new Set(numbers);
    this.numbers = [...this.set]; // We do this second to ensure order and uniqueness
  }

  difference(other: NumberSet): NumberSet {
    return new NumberSet(this.numbers.filter((x) => !other.set.has(x)));
  }

  intersection(other: NumberSet): NumberSet {
    return new NumberSet(this.numbers.filter(other.set.has));
  }

  union(other: NumberSet): NumberSet {
    return new NumberSet([...this.numbers, ...other.numbers]);
  }

  isEmpty(): boolean {
    return this.numbers.length === 0;
  }

  isSubsetOf(other: NumberSet): boolean {
    return this.numbers.every((x) => other.set.has(x));
  }

  isSupersetOf(other: NumberSet): boolean {
    return other.isSubsetOf(this);
  }

  isEqual(other: NumberSet): boolean {
    return this.isSubsetOf(other) && other.isSubsetOf(this);
  }

  min(): number | undefined {
    return this.numbers.at(0);
  }

  max(): number | undefined {
    return this.numbers.at(-1);
  }
}
