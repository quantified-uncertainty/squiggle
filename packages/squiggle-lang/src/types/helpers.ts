import { Lambda } from "../reducer/lambda/index.js";
import { tAny, Type } from "./Type.js";

// `T extends Type<infer U> ? U : never` is not enough for complex generic types.
// So we infer from `unpack()` method instead.
export type UnwrapType<T extends Type<any>> = Exclude<
  ReturnType<T["unpack"]>,
  undefined
>;

export function inferLambdaOutputType(
  lambda: Lambda,
  argTypes: Type[]
): Type | undefined {
  const possibleOutputTypes: Type<unknown>[] = [];
  for (const signature of lambda.signatures()) {
    const outputType = signature.inferOutputType(argTypes);
    if (outputType !== undefined) {
      possibleOutputTypes.push(outputType);
    }
  }
  if (!possibleOutputTypes.length) {
    return undefined;
  }
  if (possibleOutputTypes.length > 1) {
    // TODO - union
    return tAny();
  }
  return possibleOutputTypes[0];
}
