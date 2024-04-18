import { getStdLib } from "../library/index.js";
import { Lambda, UserDefinedLambda } from "../reducer/lambda.js";
import { VDomain } from "../value/VDomain.js";
import { VLambda } from "../value/vLambda.js";
import { SerializedLambda } from "./serializeLambda.js";
import { SquiggleDeserializationVisitor } from "./squiggle.js";

// Lambda deserialization is special: it relies on stdLib to look up builtins by
// name, and that could create problems with circular imports if we put
// deserialization in `VLambda` class (that's pretty low-level).
//
// So we keep the code for it here, separately from `VLambda` class and
// separately from `./serializeLambda.ts`.
export function deserializeLambda(
  value: SerializedLambda,
  visit: SquiggleDeserializationVisitor
): Lambda {
  switch (value.type) {
    case "Builtin": {
      const lambda = getStdLib().get(value.name);
      if (!lambda) {
        throw new Error(`Could not find built in function ${value.name}`);
      }
      if (!(lambda instanceof VLambda)) {
        throw new Error(`Built in function ${value.name} is not a lambda`);
      }

      // We unwrap the VLambda here, but we will wrap it again when
      // deserializing the outer VLambda, to keep the guarantee that all builtin
      // VLambdas are identical to the ones that came from the registry.
      return lambda.value;
    }
    case "UserDefined":
      return new UserDefinedLambda(
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
      );
  }
}
