import { z } from "zod";

export const zSlug = z.string().regex(/^\w[\w\-]*$/, {
  message: "Must be alphanumerical",
});
