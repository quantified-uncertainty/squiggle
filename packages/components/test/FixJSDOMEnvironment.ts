import { TestEnvironment } from "jest-environment-jsdom";

// via https://github.com/jsdom/jsdom/issues/3363#issuecomment-1467894943
export default class FixJSDOMEnvironment extends TestEnvironment {
  constructor(...args: ConstructorParameters<typeof TestEnvironment>) {
    super(...args);

    this.global.structuredClone = structuredClone;
  }
}
