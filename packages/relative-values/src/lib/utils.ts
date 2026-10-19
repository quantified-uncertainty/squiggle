export const cartesianProduct = <A, B>(a: A[], b: B[]): [A, B][] => {
  return a.flatMap((aItem) => b.map<[A, B]>((bItem) => [aItem, bItem]));
};

type Scheduler = { yield?: () => Promise<void> };

/**
 * Let the browser handle pending events and render a frame.
 *
 * Uses `scheduler.yield()` where available, then `MessageChannel` (unlike
 * `setTimeout(0)`, it isn't clamped to 4ms), then `setTimeout`.
 */
export function yieldToEventLoop(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: Scheduler }).scheduler;
  if (scheduler?.yield) {
    return scheduler.yield();
  }
  if (typeof MessageChannel !== "undefined") {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        channel.port1.close();
        resolve();
      };
      channel.port2.postMessage(null);
    });
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}
