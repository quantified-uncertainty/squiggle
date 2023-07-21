import { LambdaDeclaration } from "../../reducer/declaration.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqLambda } from "./SqLambda.js";

export class SqLambdaDeclaration {
  constructor(
    private _value: LambdaDeclaration,
    public context?: SqValueContext
  ) {}

  get fn() {
    return new SqLambda(
      this._value.fn,
      this.context
        ? this.context.extend({ type: "string", value: "fn" })
        : undefined
    );
  }

  get inputs() {
    return this._value.args;
  }
}
