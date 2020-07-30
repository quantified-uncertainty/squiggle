module MS = Belt.Map.String;

module ShapeRenderer = {
  module Sampling = {
    type inputs = {
      sampleCount: option(int),
      outputXYPoints: option(int),
      kernelWidth: option(float),
    };
    module Inputs = {
      let defaultSampleCount = 10000;
      let defaultOutputXYPoints = 10000;
      let empty = {
        sampleCount: None,
        outputXYPoints: None,
        kernelWidth: None,
      };

      type fInputs = {
        sampleCount: int,
        outputXYPoints: int,
        kernelWidth: option(float),
      };
      let toF = (i: inputs): fInputs => {
        sampleCount: i.sampleCount |> E.O.default(defaultSampleCount),
        outputXYPoints:
          i.outputXYPoints |> E.O.default(defaultOutputXYPoints),
        kernelWidth: i.kernelWidth,
      };
    };
  };

  module Symbolic = {
    type inputs = {length: int};
  };
};
