import { tArray } from "./TArray.js";
import { tDict } from "./TDict.js";
import { tNumber } from "./TNumber.js";
import { tTuple } from "./TTuple.js";

export { tArray, tDict, tNumber, tTuple };

export { tString } from "./TString.js";
export { tBool } from "./TBool.js";
export { tAny } from "./TAny.js";
export { tCalculator } from "./TCalculator.js";
export { tLambda } from "./TLambda.js";
export { tLambdaTyped } from "./TTypedLambda.js";
export { tLambdaNand } from "./TLambdaNand.js";
export { tInput } from "./TInput.js";
export { tWithTags } from "./TWithTags.js";
export { tDictWithArbitraryKeys } from "./TDictWithArbitraryKeys.js";
export { tDate } from "./TDate.js";
export { tPointSetDist } from "./TPointSetDist.js";
export { tOr } from "./TOr.js";
export { tDomain } from "./TDomain.js";
export { tDuration } from "./TDuration.js";
export { tDist } from "./TDist.js";
export { tDistOrNumber } from "./TDistOrNumber.js";
export { tSampleSetDist } from "./TSampleSetDist.js";
export { tScale } from "./TScale.js";
export { tPlot } from "./TPlot.js";
export { tSymbolicDist } from "./TSymbolicDist.js";
export { tTableChart } from "./TTableChart.js";
export { tSpecificationWithTags } from "./TSpecificationWithTags.js";
export { tSpecification } from "./TSpecification.js";

export const tMixedSet = tDict(
  ["points", tArray(tNumber)],
  ["segments", tArray(tTuple(tNumber, tNumber))]
);