@genType
type functionCallInfo = GenericDist_Types.Operation.genericFunctionCallInfo;

@genType
type env = DistributionOperation.env;

@genType
type genericDist = GenericDist_Types.genericDist;

@genType
type error = GenericDist_Types.error;

@genType
let runDistributionOperation = DistributionOperation.run;

@genType
type resultDist = result<genericDist, error>
@genType
type resultFloat = result<float, error>
@genType
type resultString = result<string, error>