import { result } from "../utility/result.js";
import { SqError } from "./SqError.js";
import { RunOutputWithExternals } from "./SqProject/ProjectItem.js";
import { SqValue } from "./SqValue/index.js";
import { SqDict } from "./SqValue/SqDict.js";

export type SqOutput = {
  result: SqValue;
  bindings: SqDict;
  imports: SqDict;
  exports: SqDict;
  raw: RunOutputWithExternals; // original output, not upgraded to SqValues - useful if you want to do serialization
};

export type SqOutputResult = result<SqOutput, SqError>;
