import { SDate } from "../utility/SDate.js";
import { DateRangeDomain } from "./DateRangeDomain.js";
import { Domain } from "./index.js";
import { NumericRangeDomain } from "./NumberRangeDomain.js";

export type SerializedDomain =
  | {
      kind: "NumericRange";
      min: number;
      max: number;
    }
  | {
      kind: "DateRange";
      min: number;
      max: number;
    };

export function serializeDomain(domain: Domain): SerializedDomain {
  switch (domain.kind) {
    case "NumericRange":
      return {
        kind: "NumericRange",
        min: domain.min,
        max: domain.max,
      };
    case "DateRange":
      return {
        kind: "DateRange",
        min: domain.min.toMs(),
        max: domain.max.toMs(),
      };
    case "Type":
      throw new Error("Not implemented");
  }
}

export function deserializeDomain(domain: SerializedDomain): Domain {
  switch (domain.kind) {
    case "NumericRange":
      return new NumericRangeDomain(domain.min, domain.max);
    case "DateRange":
      return new DateRangeDomain(
        SDate.fromMs(domain.min),
        SDate.fromMs(domain.max)
      );
  }
}
