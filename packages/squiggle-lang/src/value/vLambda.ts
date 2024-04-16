import { REOther } from "../errors/messages.js";
import { getStdLib } from "../library/index.js";
import {
  Lambda,
  UserDefinedLambda,
  UserDefinedLambdaParameter,
} from "../reducer/lambda.js";
import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../serialization/squiggle.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { BaseValue } from "./BaseValue.js";
import { Value } from "./index.js";
import { Indexable } from "./mixins.js";
import { vArray } from "./VArray.js";
import { vDict } from "./VDict.js";
import { VDomain } from "./VDomain.js";
import { vString } from "./VString.js";

type SerializedParameter = Omit<UserDefinedLambdaParameter, "domain"> & {
  domainId?: number | undefined;
};

export type SerializedLambda =
  | {
      type: "Builtin";
      name: string;
    }
  | {
      type: "UserDefined";
      name?: string;
      expressionId: number;
      parameters: SerializedParameter[];
      captureIds: number[];
    };

export class VLambda
  extends BaseValue<"Lambda", SerializedLambda>
  implements Indexable
{
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

  override serializePayload(
    visit: SquiggleSerializationVisitor
  ): SerializedLambda {
    switch (this.value.type) {
      case "BuiltinLambda":
        return {
          type: "Builtin",
          name: this.value.name,
        };
      case "UserDefinedLambda":
        return {
          type: "UserDefined",
          name: this.value.name,
          expressionId: visit.expression(this.value.expression),
          parameters: this.value.parameters.map((parameter) => ({
            ...parameter,
            domainId: parameter.domain
              ? visit.value(parameter.domain)
              : undefined,
          })),
          captureIds: this.value.captures.map((capture) =>
            visit.value(capture)
          ),
        };
    }
  }

  static deserialize(
    value: SerializedLambda,
    visit: SquiggleDeserializationVisitor
  ): VLambda {
    switch (value.type) {
      case "Builtin": {
        const lambda = getStdLib().get(value.name);
        if (!lambda) {
          throw new Error(`Could not find built in function ${value.name}`);
        }
        if (!(lambda instanceof VLambda)) {
          throw new Error(`Built in function ${value.name} is not a lambda`);
        }
        return lambda;
      }
      case "UserDefined":
        return new VLambda(
          new UserDefinedLambda(
            value.name,
            value.captureIds.map((id) => visit.value(id)),
            value.parameters.map((parameter) => {
              let domain: VDomain | undefined;
              if (parameter.domainId !== undefined) {
                const shouldBeDomain = visit.value(parameter.domainId);
                if (!(shouldBeDomain instanceof VDomain)) {
                  throw new Error("Serialized domain is not a domain");
                }
                domain = shouldBeDomain;
              }
              return {
                ...parameter,
                domain,
              };
            }),
            visit.expression(value.expressionId)
          )
        );
    }
  }
}

export const vLambda = (v: Lambda) => new VLambda(v);
