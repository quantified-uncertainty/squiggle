import { Lambda } from "../reducer/lambda/index.js";
import { vDomain } from "../value/VDomain.js";
import { SquiggleSerializationVisitor } from "./squiggle.js";

// TODO - serialize other input fields, e.g. `optional`? not necessary for now
type SerializedInput = {
  name: string | null;
  typeId?: number;
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
      // TODO - serialize the entire signature (output)?
      inputs: SerializedInput[];
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
        inputs: lambda.signature.inputs.map((input) => ({
          name: input.name ?? null,
          typeId: input.type ? visit.value(vDomain(input.type)) : undefined,
        })),
        captureIds: lambda.captures.map((capture) => visit.value(capture)),
      };
  }
}
