import { Lambda } from "../reducer/lambda/index.js";
import { UserDefinedLambdaParameter } from "../reducer/lambda/UserDefinedLambda.js";
import { SquiggleSerializationVisitor } from "./squiggle.js";

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
      irId: number;
      parameters: SerializedParameter[];
      captureIds: number[];
    };

export function serializeLambda(
  lambda: Lambda,
  visit: SquiggleSerializationVisitor
): SerializedLambda {
  switch (lambda.type) {
    case "BuiltinLambda":
      return {
        type: "Builtin",
        name: lambda.name,
      };
    case "UserDefinedLambda":
      return {
        type: "UserDefined",
        name: lambda.name,
        irId: visit.ir(lambda.body),
        parameters: lambda.parameters.map((parameter) => ({
          ...parameter,
          domainId: parameter.domain
            ? visit.value(parameter.domain)
            : undefined,
        })),
        captureIds: lambda.captures.map((capture) => visit.value(capture)),
      };
  }
}
