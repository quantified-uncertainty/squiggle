import { result } from "../utility/result.js";
import { SqError } from "./SqError.js";
import { SqValue } from "./SqValue/index.js";
import { SqRecord } from "./SqValue/SqRecord.js";

export type SqOutput = {
  result: SqValue;
  bindings: SqRecord;
};

export type SqOutputResult = result<SqOutput, SqError>;
