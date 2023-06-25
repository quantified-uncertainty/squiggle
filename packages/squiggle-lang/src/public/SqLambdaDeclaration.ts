import { LambdaDeclaration } from "../reducer/declaration.js";
import { SqLambda } from "./SqLambda.js";
import { SqValuePath } from "./SqValuePath.js";

export class SqLambdaDeclaration {
  constructor(private _value: LambdaDeclaration, public path?: SqValuePath) {}

  get fn() {
    return new SqLambda(
      this._value.fn,
      this.path ? this.path.extend("fn") : undefined
    );
  }

  get inputs() {
    return this._value.args;
  }
}
