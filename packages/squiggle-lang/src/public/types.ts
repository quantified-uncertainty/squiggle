import { result } from "../utility/result.js";
import { SqError } from "./SqError.js";
import { SqValue } from "./SqValue/index.js";
import { SqDict } from "./SqValue/SqDict.js";

export type SqOutput = {
  result: SqValue;
  bindings: SqDict;
  exports: SqDict;
};

export type SqOutputResult = result<SqOutput, SqError>;
