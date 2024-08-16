import { tArray } from "./TArray.js";
import { tDict } from "./TDict.js";
import { tNumber } from "./TIntrinsic.js";
import { tTuple } from "./TTuple.js";

export {
  tBool,
  tCalculator,
  tDate,
  tDuration,
  tInput,
  tLambda,
  tPlot,
  tScale,
  tSpecification,
  tString,
  tTableChart,
} from "./TIntrinsic.js";

export { tArray, tDict, tNumber, tTuple };

export { tAny } from "./Type.js";
export { tTypedLambda } from "./TTypedLambda.js";
export { tLambdaNand } from "./TLambdaNand.js";
export { tTagged as tWithTags } from "./TTagged.js";
export { tDictWithArbitraryKeys } from "./TDictWithArbitraryKeys.js";
export {
  tDist,
  tPointSetDist,
  tSampleSetDist,
  tSymbolicDist,
} from "./TDist.js";
export { tOr } from "./TOr.js";
export { tDomain } from "./TDomain.js";
export { tDistOrNumber } from "./TDistOrNumber.js";

export const tMixedSet = tDict(
  ["points", tArray(tNumber)],
  ["segments", tArray(tTuple(tNumber, tNumber))]
);
