module InputTypes = {
  type t =
    | Year(float)
    | SingleChoice(string)
    | FloatPoint(float)
    | FloatCdf(string);

  type withName = (string, t);
  let withoutName = ((_, t): withName) => t;
  type withNames = list(withName);
  let getName = (r: withNames, name) =>
    r->Belt.List.getBy(((n, _)) => n == name);
  let to_string = (t: t) => {
    switch (t) {
    | SingleChoice(r) => r
    | FloatCdf(r) => r
    | Year(r) => r |> Js.Float.toFixed
    | FloatPoint(r) => r |> Js.Float.toFixed
    };
  };
};

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

  type outputConfig =
    | Single;

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
  outputConfig: Output.outputConfig,
};

let gatherInputs = (m: model, a: list(InputTypes.withName)) => {
  let getItem = (p: Input.parameter) => InputTypes.getName(a, p.id);
  [
    m.assumptions |> List.map(getItem),
    m.inputs |> List.map(getItem),
    [InputTypes.getName(a, "output")],
  ]
  |> List.flatten;
};

type modelParams = {
  assumptions: list(option(InputTypes.t)),
  inputs: list(option(InputTypes.t)),
  output: option(InputTypes.t),
};

let response = (m: model, a: list(InputTypes.withName)) => {
  let getItem = (p: Input.parameter) =>
    InputTypes.getName(a, p.id)->Belt.Option.map(InputTypes.withoutName);
  {
    assumptions: m.assumptions |> List.map(getItem),
    inputs: m.inputs |> List.map(getItem),
    output:
      InputTypes.getName(a, "output")
      ->Belt.Option.map(InputTypes.withoutName),
  };
};