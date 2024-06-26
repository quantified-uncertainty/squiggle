import { REOther } from "../errors/messages.js";
import { Lambda } from "../reducer/lambda.js";
import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { BaseValue } from "./BaseValue.js";
import { Value } from "./index.js";
import { Indexable } from "./mixins.js";
import { vArray } from "./VArray.js";
import { vDict } from "./VDict.js";
import { vString } from "./VString.js";

export class VLambda extends BaseValue<"Lambda", number> implements Indexable {
  readonly type = "Lambda";

  override get publicName() {
    return "Function";
  }

  constructor(public value: Lambda) {
    super();
  }

  valueToString() {
    return this.value.toString();
  }

  get(key: Value) {
    if (key.type === "String" && key.value === "parameters") {
      switch (this.value.type) {
        case "UserDefinedLambda":
          return vArray(
            this.value.parameters.map((parameter) => {
              const fields: [string, Value][] = [
                ["name", vString(parameter.name)],
              ];
              if (parameter.domain) {
                fields.push(["domain", parameter.domain]);
              }
              return vDict(ImmutableMap(fields));
            })
          );
        case "BuiltinLambda":
          throw new REOther("Can't access parameters on built in functions");
      }
    }
    throw new REOther("No such field");
  }

  override serializePayload(visit: SquiggleSerializationVisitor) {
    return visit.lambda(this.value);
  }

  // deserialization is implemented in ./serialize.ts, because of circular import issues.
}

export const vLambda = (v: Lambda) => new VLambda(v);
