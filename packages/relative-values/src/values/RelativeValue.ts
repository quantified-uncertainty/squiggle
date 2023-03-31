import { result } from "@quri/squiggle-lang";

export type RelativeValue = Readonly<{
  median: number;
  min: number;
  max: number;
  db: number;
}>;

export type RelativeValueResult = result<RelativeValue, string>;
