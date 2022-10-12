global.console = {
  ...console,
  log: jest.fn(console.log),
  debug: jest.fn(console.debug),
  info: jest.fn(console.info),
  warn: jest.fn(console.warn),
  error: jest.fn(console.error),
};
