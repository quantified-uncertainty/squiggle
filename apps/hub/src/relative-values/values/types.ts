import _ from "lodash";
import { z } from "zod";

import { result } from "@quri/squiggle-lang";

export const relativeValueSchema = z.object({
  median: z.number(),
  mean: z.number(),
  min: z.number(),
  max: z.number(),
  uncertainty: z.number(),
});

export type RelativeValue = Readonly<z.infer<typeof relativeValueSchema>>;

export type RelativeValueResult = result<RelativeValue, string>;

export type RelativeValuesCacheRecord = Record<
  string,
  Record<string, RelativeValueResult>
>;
