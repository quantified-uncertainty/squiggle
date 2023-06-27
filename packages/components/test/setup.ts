import { jest } from "@jest/globals";
import { ResizeObserver } from "@juggle/resize-observer";

window.ResizeObserver = ResizeObserver;

global.console = {
  ...console,
  /* eslint-disable no-console */
  log: jest.fn(console.log),
  debug: jest.fn(console.debug),
  info: jest.fn(console.info),
  warn: jest.fn(console.warn),
  error: jest.fn(console.error),
  /* eslint-enable no-console */
};

// via https://github.com/jsdom/jsdom/issues/3002#issuecomment-1118039915
Range.prototype.getBoundingClientRect = () => ({
  height: 0,
  width: 0,
  x: 0,
  y: 0,
  bottom: 0,
  left: 0,
  right: 0,
  top: 0,
  toJSON() {},
});

Range.prototype.getClientRects = () => ({
  item: () => null,
  length: 0,
  [Symbol.iterator]: jest.fn<() => IterableIterator<DOMRect>>(),
});
