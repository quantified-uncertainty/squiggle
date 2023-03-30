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
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
});
Range.prototype.getClientRects = () => ({
  item: () => null,
  length: 0,
  [Symbol.iterator]: jest.fn(),
});
