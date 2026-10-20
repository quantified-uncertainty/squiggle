// Studio's own writes, so that their watcher events are recognised as echoes
// by hash rather than by a time window (#34), plus the bookkeeping that makes
// an event for a path wait until Studio's writes to it have answered (§2.7).

import { DELETED } from "./classify.js";

export const OWN_WRITE_TTL_MS = 10_000;

// path → the hash Studio last wrote there (DELETED for a rename's source).
// Filled from write, create, rename and Hub-import responses; entries expire
// after 10 s, and are forgotten as soon as the path changes externally.
export class OwnWrites {
  private readonly entries = new Map<string, { hash: string; at: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  record(path: string, hash: string): void {
    this.entries.set(path, { hash, at: this.now() });
  }

  recordDeleted(path: string): void {
    this.record(path, DELETED);
  }

  get(path: string): string | undefined {
    const entry = this.entries.get(path);
    if (!entry) return undefined;
    if (this.now() - entry.at > OWN_WRITE_TTL_MS) {
      this.entries.delete(path);
      return undefined;
    }
    return entry.hash;
  }

  has(path: string): boolean {
    return this.get(path) !== undefined;
  }

  forget(path: string): void {
    this.entries.delete(path);
  }

  clear(): void {
    this.entries.clear();
  }
}

// Writes Studio has started but that haven't answered yet, per path. An event
// for such a path waits for them before it is classified, so that the echo
// of a save is compared with the hash the save returned.
export class PendingWrites {
  private readonly pending = new Map<string, Set<Promise<unknown>>>();

  track<T>(paths: readonly string[], promise: Promise<T>): Promise<T> {
    const settled = promise.then(
      () => undefined,
      () => undefined
    );
    for (const path of paths) {
      const set = this.pending.get(path) ?? new Set<Promise<unknown>>();
      set.add(settled);
      this.pending.set(path, set);
    }
    void settled.then(() => {
      for (const path of paths) {
        const set = this.pending.get(path);
        set?.delete(settled);
        if (set?.size === 0) this.pending.delete(path);
      }
    });
    return promise;
  }

  has(path: string): boolean {
    return this.pending.has(path);
  }

  // Resolves when every write to `path` that started before the call has
  // answered (successfully or not).
  async settled(path: string): Promise<void> {
    const set = this.pending.get(path);
    if (set) await Promise.all([...set]);
  }

  clear(): void {
    this.pending.clear();
  }
}

// Runs tasks one after another per key (events for one path are handled in
// order, even when handling one awaits a read).
export class SerialQueue {
  private readonly tails = new Map<string, Promise<void>>();

  run(key: string, task: () => Promise<void>): Promise<void> {
    const previous = this.tails.get(key) ?? Promise.resolve();
    const next = previous.then(task, task);
    const tail = next.catch(() => undefined);
    this.tails.set(key, tail);
    void tail.then(() => {
      if (this.tails.get(key) === tail) this.tails.delete(key);
    });
    return next;
  }

  idle(key: string): boolean {
    return !this.tails.has(key);
  }

  clear(): void {
    this.tails.clear();
  }
}
