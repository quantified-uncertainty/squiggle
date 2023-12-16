import { BoxedArgs } from "../../value/boxed.js";
import { Value } from "../../value/index.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqValue, wrapValue } from "./index.js";

export class SqBoxed {
  constructor(
    private readonly _value: Value,
    private readonly args: BoxedArgs,
    public context?: SqValueContext
  ) {}

  get value() {
    return wrapValue(this._value, this.context);
  }

  name(): string | undefined {
    return this.args.name();
  }

  description(): string | undefined {
    return this.args.description();
  }

  showAs(): SqValue | undefined {
    const showAs = this.args.showAs();
    return showAs ? wrapValue(showAs, this.context) : undefined;
  }

  focus(): true | undefined {
    return this.args.value.focus;
  }
}
