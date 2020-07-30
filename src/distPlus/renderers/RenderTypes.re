module ShapeRenderer = {
  module Sampling = {
    type inputs = {
      sampleCount: option(int),
      outputXYPoints: option(int),
      kernelWidth: option(float),
    };

    let defaults = {
      sampleCount: Some(10000),
      outputXYPoints: Some(1000),
      kernelWidth: None
    }
  };

  module Symbolic = {
    type inputs = {length: int};
  };
};
