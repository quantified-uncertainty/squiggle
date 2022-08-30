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
    if (this.location.path.root !== "bindings") {
      return {
        tag: "Error",
        value: SqError.createTodoError("Only bindings lambdas can be rendered"),
      };
    }
    const quote = (arg: string) =>
      `"${arg.replace(new RegExp('"', "g"), '\\"')}"`;
    const argsSource = args
      .map((arg) => (typeof arg === "number" ? arg : quote(arg)))
      .join(",");
    const functionNameSource = this.location.path.items
      .map((item, i) =>
        typeof item === "string" ? (i ? "." + item : item) : `[${item}]`
      )
      .join("");
    const source = `${functionNameSource}(${argsSource})`;
    project.setSource(callId, source);
    project.setContinues(callId, [sourceId]);
    project.run(callId);
    return project.getResult(callId);
  }
}
