import { z } from "zod";

import { result } from "@quri/squiggle-lang";

export const relativeValueSchema = z.object({
  median: z.number(),
  mean: z.number(),
  min: z.number(), // p5
  max: z.number(), // p95
  uncertainty: z.number(), // log10(p95 / p5) of the absolute ratio
});

export type RelativeValue = Readonly<z.infer<typeof relativeValueSchema>>;

export type RelativeValueResult = result<RelativeValue, string>;
