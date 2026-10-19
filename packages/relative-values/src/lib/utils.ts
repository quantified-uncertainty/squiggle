export const cartesianProduct = <A, B>(a: A[], b: B[]): [A, B][] => {
  return a.flatMap((aItem) => b.map<[A, B]>((bItem) => [aItem, bItem]));
};

/**
 * Let the browser handle pending events (input, timers, network) and render a
 * frame.
 *
 * Uses `MessageChannel`, which (unlike `setTimeout(0)`) isn't clamped to 4ms
 * when nested. Not `scheduler.yield()`: its continuations are prioritized over
 * other tasks, so the page's own timers would starve until we're done.
 */
export function yieldToEventLoop(): Promise<void> {
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
