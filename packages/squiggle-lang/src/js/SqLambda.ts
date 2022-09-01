import * as RSLambda from "../rescript/ForTS/ForTS_SquiggleValue/ForTS_SquiggleValue_Lambda.gen";
import { SqError } from "./SqError";
import { SqValue } from "./SqValue";
import { SqValueLocation } from "./SqValueLocation";
import { result } from "./types";

type T = RSLambda.squiggleValue_Lambda;

export class SqLambda {
  constructor(private _value: T, public location: SqValueLocation) {}

  parameters() {
    return RSLambda.parameters(this._value);
  }

  call(args: (number | string)[]): result<SqValue, SqError> {
    const { project, sourceId } = this.location;
    // Might be good to use uuid instead, but there's no way to remove sources from projects.
    // So this is not thread-safe.
    const callId = "__lambda__";
    const quote = (arg: string) =>
      `"${arg.replace(new RegExp('"', "g"), '\\"')}"`;
    const argsSource = args
      .map((arg) => (typeof arg === "number" ? arg : quote(arg)))
      .join(",");

    // end expression values are exposed in bindings via secret `__result__` variable and we can access them through it
    const pathItems = [
      ...(this.location.path.root === "result" ? ["__result__"] : []),
      ...this.location.path.items,
    ];

    // full function name, e.g. foo.bar[3].baz
    const functionNameSource = pathItems
      .map((item, i) =>
        typeof item === "string" ? (i ? "." + item : item) : `[${item}]`
      )
      .join("");

    // something like: foo.bar[3].baz(1,2,3)
    const source = `${functionNameSource}(${argsSource})`;

    project.setSource(callId, source);
    project.setContinues(callId, [sourceId]);
    project.run(callId);
    return project.getResult(callId);
  }
}
