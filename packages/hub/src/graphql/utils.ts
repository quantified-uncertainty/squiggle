import { decodeGlobalID } from "@pothos/plugin-relay";
import { ValidationOptions } from "@pothos/plugin-validation";

export const validateSlug: ValidationOptions<string> = {
  regex: [/^\w[\w\-]*$/, { message: "Must be alphanumerical" }],
};

export function decodeGlobalIdWithTypename(
  id: string,
  typenames: string | string[] // TODO - union based on Pothos types?
) {
  // wrapper around decodeGlobalID from Pothos Relay Plugin
  const { typename: decodedTypename, id: decodedId } = decodeGlobalID(id);

  if (typeof typenames === "string") {
    typenames = [typenames];
  }
  if (!typenames.includes(decodedTypename)) {
    throw new Error(
      `Expected ${typenames.join("|")} id, got: ${decodedTypename}`
    );
  }

  return decodedId;
}
