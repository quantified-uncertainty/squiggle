import { z } from "zod";

export const numberInString = z.string().transform((val, ctx) => {
  const parsed = parseInt(val);
  if (isNaN(parsed)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Not a number",
    });

    // This is a special symbol you can use to
    // return early from the transform function.
    // It has type `never` so it does not affect the
    // inferred return type.
    return z.NEVER;
  }
  return parsed;
});

export const zSlug = z.string().regex(/^\w[\w\-]*$/, {
  message: "Must be alphanumerical",
});

export const zColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, {
  message: "Must be a valid hex color",
});
