import { TestEnvironment } from "jest-environment-jsdom";

// jsdom without the Node globals that Squiggle needs; see
// https://github.com/jsdom/jsdom/issues/3363#issuecomment-1467894943
export default class JSDOMEnvironment extends TestEnvironment {
  constructor(...args: ConstructorParameters<typeof TestEnvironment>) {
    super(...args);
    this.global.structuredClone = structuredClone;
    this.global.TextEncoder = TextEncoder;
    this.global.TextDecoder = TextDecoder as typeof this.global.TextDecoder;
  }
}
