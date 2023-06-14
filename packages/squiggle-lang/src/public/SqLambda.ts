import { Env, defaultEnv } from "../dist/env.js";
import { stdLib } from "../library/index.js";
import { registry } from "../library/registry/index.js";
import { createContext } from "../reducer/Context.js";
import { IError } from "../reducer/IError.js";
import { evaluate } from "../reducer/index.js";
import { Lambda } from "../reducer/lambda.js";
import * as Result from "../utility/result.js";
import { result } from "../utility/result.js";
import { SqError } from "./SqError.js";
import { SqValue, wrapValue } from "./SqValue.js";
import { SqValueLocation } from "./SqValueLocation.js";

export class SqLambda {
  constructor(
    public _value: Lambda, // public because of SqFnPlot.create
    public location?: SqValueLocation
  ) {}

  static createFromStdlibName(name: string) {
    return new SqLambda(registry.makeLambda(name));
  }

  parameters() {
    return this._value.getParameters();
  }

  directCall(args: SqValue[], env: Env): result<SqValue, SqError> {
    const rawArgs = args.map((arg) => arg._value);
    try {
      const value = this._value.call(
        rawArgs,
        createContext(stdLib, env),
        evaluate
      );
      return Result.Ok(wrapValue(value));
    } catch (e) {
      return Result.Err(new SqError(IError.fromException(e)));
    }
  }

  // deprecated, prefer `directCall`, it's much faster
  call(args: (number | string)[]): result<SqValue, SqError> {
    if (!this.location) {
      throw new Error("Can't call a location-less Lambda");
    }
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

  toString() {
    return this._value.toString();
  }
}
