import { SqError } from "./SqError";
import { SqValue } from "./SqValue";
import { SqValueLocation } from "./SqValueLocation";
import { result } from "../utility/result";
import { Lambda } from "../reducer/lambda";

export class SqLambda {
  constructor(private _value: Lambda, public location: SqValueLocation) {}

  parameters() {
    return this._value.getParameters();
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
