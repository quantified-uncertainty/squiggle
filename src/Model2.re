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

module MS = Belt.Map.String;

type modelMaps = {
  assumptions: MS.t((Input.parameter, option(InputTypes.t))),
  inputs: MS.t((Input.parameter, option(InputTypes.t))),
  output: (Output.parameter, option(InputTypes.t)),
};

let toMaps = (m: model): modelMaps => {
  assumptions:
    MS.fromArray(
      m.assumptions
      |> List.map((r: Input.parameter) =>
           (r.id, (r, Input.toInput(r.parameterType)))
         )
      |> Array.of_list,
    ),
  inputs:
    MS.fromArray(
      m.inputs
      |> List.map((r: Input.parameter) =>
           (r.id, (r, Input.toInput(r.parameterType)))
         )
      |> Array.of_list,
    ),
  output: (Output.make(~name="Payouts", ~parameterType=FloatCdf, ()), None),
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