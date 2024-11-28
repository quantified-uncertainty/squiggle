import { z } from "zod";

export const zSlug = z.string().regex(/^\w[\w\-]*$/, {
  message: "Must be alphanumerical",
});

export function makeServerAction<T, R>(
  schema: z.ZodType<T>,
  handler: (input: T) => Promise<R>
) {
  return async (
    data: T // data type is unknown but we will validate it immediately
  ) => {
    const input = schema.parse(data);
    return handler(input);
  };
}
