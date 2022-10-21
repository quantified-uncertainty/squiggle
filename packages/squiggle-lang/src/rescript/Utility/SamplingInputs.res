type samplingInputs = {
  sampleCount: int,
  outputXYPoints: int,
  kernelWidth: option<float>,
  pointSetDistLength: int,
}

module SamplingInputs = {
  type t = {
    sampleCount: option<int>,
    outputXYPoints: option<int>,
    kernelWidth: option<float>,
    pointSetDistLength: option<int>,
  }
  let withDefaults = (t: t): samplingInputs => {
    sampleCount: t.sampleCount->E.O.default(10000),
    outputXYPoints: t.outputXYPoints->E.O.default(10000),
    kernelWidth: t.kernelWidth,
    pointSetDistLength: t.pointSetDistLength->E.O.default(10000),
  }
}
