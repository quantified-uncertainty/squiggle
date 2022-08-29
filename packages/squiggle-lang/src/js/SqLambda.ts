import * as RSLambda from "../rescript/ForTS/ForTS_SquiggleValue/ForTS_SquiggleValue_Lambda.gen";
import { SqValueLocation } from "./SqValueLocation";

type T = RSLambda.squiggleValue_Lambda;

export class SqLambda {
  constructor(private _value: T, public location: SqValueLocation) {}

  parameters() {
    return RSLambda.parameters(this._value);
  }
}
