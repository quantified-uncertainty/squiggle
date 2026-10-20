import fs from "fs";
import path from "path";

/**
 * Runs `task` on `run()`, and on `trigger()` after `debounceMs` of quiet.
 *
 * Requests that arrive while `task` is running are not dropped: they schedule
 * one more run right after the current one finishes. `task` must not throw.
 */
export function makeRerunScheduler(
  task: () => Promise<void>,
  debounceMs: number
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let pending = false;

  const start = async () => {
    running = true;
    await task();
    running = false;
    if (pending) {
      pending = false;
      // If a trigger is still debouncing, its timer will start the next run.
      if (timer === undefined) void start();
    }
  };

  // Runs `task` now, or right after the current run.
  const run = async () => {
    if (running) {
      pending = true;
      return;
    }
    await start();
  };

  return {
    run,
    trigger() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        void run();
      }, debounceMs);
    },
    // Cancels debounced and pending runs; doesn't interrupt the current one.
    cancel() {
      clearTimeout(timer);
      timer = undefined;
      pending = false;
    },
  };
}

/**
 * Calls `onChange` when any of the watched files changes.
 *
 * Watches the files' directories rather than the files themselves, so that it
 * keeps working when an editor saves by renaming a new file over the old one.
 */
export function makeFileWatcher(onChange: () => void) {
  const dirWatchers = new Map<string, fs.FSWatcher>();
  let files = new Set<string>();
  let closed = false;

  return {
    // Replaces the set of watched files. Does nothing after `close()`.
    setFiles(newFiles: string[]) {
      if (closed) return;
      files = new Set(newFiles.map((file) => path.resolve(file)));
      const dirs = new Set([...files].map((file) => path.dirname(file)));

      for (const [dir, watcher] of dirWatchers) {
        if (!dirs.has(dir)) {
          watcher.close();
          dirWatchers.delete(dir);
        }
      }
      for (const dir of dirs) {
        if (dirWatchers.has(dir) || !fs.existsSync(dir)) continue;
        dirWatchers.set(
          dir,
          fs.watch(dir, (_event, name) => {
            // `name` is not guaranteed on all platforms
            if (name === null || files.has(path.join(dir, name))) {
              onChange();
            }
          })
        );
      }
    },
    size() {
      return files.size;
    },
    close() {
      closed = true;
      for (const watcher of dirWatchers.values()) {
        watcher.close();
      }
      dirWatchers.clear();
    },
  };
}
