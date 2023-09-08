import { ValidationOptions } from "@pothos/plugin-validation";

export const validateSlug: ValidationOptions<string> = {
  regex: [/^\w[\w\-]*$/, { message: "Must be alphanumerical" }],
};
