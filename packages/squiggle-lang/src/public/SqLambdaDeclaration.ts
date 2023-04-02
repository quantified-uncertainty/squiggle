import { LambdaDeclaration } from "../reducer/declaration.js";
import { SqLambda } from "./SqLambda.js";
import { SqValueLocation } from "./SqValueLocation.js";

export class SqLambdaDeclaration {
  constructor(
    private _value: LambdaDeclaration,
    public location: SqValueLocation
  ) {}

  get fn() {
    return new SqLambda(
      this._value.fn,
      new SqValueLocation(this.location.project, this.location.sourceId, {
        ...this.location.path,
        items: [...this.location.path.items, "fn"],
      })
    );
  }

  get inputs() {
    return this._value.args;
  }
}
