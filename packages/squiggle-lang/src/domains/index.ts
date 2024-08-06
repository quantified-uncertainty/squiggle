import { DateRangeDomain } from "./DateRangeDomain.js";
import { NumericRangeDomain } from "./NumberRangeDomain.js";
import { TypeDomain } from "./TypeDomain.js";

export type Domain = NumericRangeDomain | DateRangeDomain | TypeDomain<any>;
