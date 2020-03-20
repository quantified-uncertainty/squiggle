[@bs.deriving abstract]
type discrete = {
  xs: array(float),
  ys: array(float),
};

let jsToDistDiscrete = (d: discrete): DistTypes.discreteShape => {
  xs: xsGet(d),
  ys: ysGet(d),
};

[@bs.module "./GuesstimatorLibrary.js"]
external stringToSamples: (string, int) => array(float) = "stringToSamples";