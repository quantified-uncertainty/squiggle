// Temporary, very slow!
// Replace with immutable-js or copy-paste from Rescript's Belt.Map or some other implementation.
export class ImmutableMap<T> {
  private value: Map<string, T>;
  private constructor(value: Map<string, T>) {
    this.value = value;
  }

  static make<T>() {
    return new ImmutableMap(new Map<string, T>());
  }

  static fromArray<T>(a: [string, T][]) {
    return new ImmutableMap(new Map(a));
  }

  has(key: string): boolean {
    return this.value.has(key);
  }

  get(key: string): T | undefined {
    return this.value.get(key);
  }

  delete(key: string): ImmutableMap<T> {
    const copy = new Map(this.value.entries());
    copy.delete(key);
    return new ImmutableMap(copy);
  }

  set(key: string, value: T): ImmutableMap<T> {
    const copy = new Map(this.value.entries());
    copy.set(key, value);
    return new ImmutableMap(copy);
  }

  keys() {
    return this.value.keys();
  }

  values() {
    return this.value.values();
  }

  entries() {
    return this.value.entries();
  }
}
