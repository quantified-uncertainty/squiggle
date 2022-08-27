import * as RSLambda from "../rescript/ForTS/ForTS_SquiggleValue/ForTS_SquiggleValue_Lambda.gen";

type T = RSLambda.squiggleValue_Lambda;

export class Lambda {
  _value: T;

  constructor(_value: T) {
    this._value = _value;
  }

  parameters() {
    return RSLambda.parameters(this._value);
  }
}
