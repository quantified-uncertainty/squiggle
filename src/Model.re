module IOTypes = {
  type singleChoice = {
    options: list((string, string)),
    default: option(string),
  };
  type floatPoint = {validatations: list(float => bool)};
  type withDefaultMinMax('a) = {
    default: option('a),
    min: option('a),
    max: option('a),
  };
};

module Input = {
  type parameterType =
    | Year(IOTypes.withDefaultMinMax(float))
    | SingleChoice(IOTypes.singleChoice)
    | FloatPoint
    | FloatCdf;

  type parameter = {
    id: string,
    name: string,
    parameterType,
  };

  let currentYear = {
    id: "currentyear",
    name: "Current Year",
    parameterType: FloatPoint,
  };

  let make = (~name, ~parameterType, ~id=name, ()) => {
    id,
    name,
    parameterType,
  };
};

module Output = {
  type parameterType =
    | Year
    | SingleChoice(IOTypes.singleChoice)
    | FloatPoint
    | FloatCdf;

  type parameter = {
    id: string,
    name: string,
    parameterType,
  };

  let make = (~name, ~parameterType, ~id=name, ()) => {
    id,
    name,
    parameterType,
  };
};

type model = {
  name: string,
  author: string,
  assumptions: list(Input.parameter),
  inputs: list(Input.parameter),
  outputs: list(Output.parameter),
};