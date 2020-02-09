module Value = {
  type t =
    | SelectSingle(string)
    | FloatPoint(float)
    | FloatCdf(string);

  let to_string = (t: t) => {
    switch (t) {
    | SelectSingle(r) => r
    | FloatCdf(r) => r
    | FloatPoint(r) => r |> Js.Float.toFixed
    };
  };
};

module Type = {
  type selectOption = {
    id: string,
    name: string,
  };

  type selectSingle = {
    options: list(selectOption),
    default: option(string),
  };

  type floatPoint = {validatations: list(float => bool)};

  type withDefaultMinMax('a) = {
    default: option('a),
    min: option('a),
    max: option('a),
  };

  type t =
    | SelectSingle(selectSingle)
    | FloatPoint(withDefaultMinMax(float))
    | Year(withDefaultMinMax(float))
    | FloatCdf;

  let default = (t: t) =>
    switch (t) {
    | Year(r) => r.default->Belt.Option.map(p => Value.FloatPoint(p))
    | SelectSingle(r) =>
      r.default->Belt.Option.map(p => Value.SelectSingle(p))
    | FloatPoint(r) => r.default->Belt.Option.map(p => Value.FloatPoint(p))
    | FloatCdf => None
    };
};

module ValueMap = {
  module MS = Belt.Map.String;
  type t = MS.t(Value.t);
  let get = MS.get;
  let keys = MS.keysToArray;
  let map = MS.map;
  let fromArray = MS.fromArray;
  let values = t => t |> MS.valuesToArray;
  let update = MS.update;
  let toArray = MS.toArray;
  let fromOptionalMap = (t: MS.t(option(Value.t))): t =>
    MS.keep(t, (_, d) => E.O.isSome(d))
    ->MS.map(d => E.O.toExn("This should not have happened", d));
};

module TypeWithMetadata = {
  // TODO: Figure out a better name for assumptionType
  type assumptionType =
    | INPUT
    | ASSUMPTION;

  type t = {
    id: string,
    name: string,
    description: option(string),
    type_: Type.t,
    assumptionType,
  };

  type ts = list(t);

  // TODO: Change default here
  let currentYear = {
    id: "currentyear",
    name: "Current Year",
    description: None,
    type_: FloatPoint({default: None, min: None, max: None}),
    assumptionType: ASSUMPTION,
  };

  let make =
      (~name, ~type_, ~id=name, ~description=None, ~assumptionType=INPUT, ()) => {
    id,
    name,
    type_,
    description,
    assumptionType,
  };

  let toValueMap = (ts: ts) => {
    ts
    ->Array.of_list
    ->Belt.Array.map((b: t) => (b.name, Type.default(b.type_)))
    ->ValueMap.fromArray
    ->ValueMap.fromOptionalMap;
  };
};

module Model = {
  type t = {
    name: string,
    author: string,
    inputTypes: list(TypeWithMetadata.t),
    ouputTypes: list(TypeWithMetadata.t),
  };
  type inputValues = {
    inputs: ValueMap.t,
    outputSelection: string,
  };
  type outputValues = ValueMap.t;

  module InputValues = {
    let defaults = (t: t): inputValues => {
      inputs: t.inputTypes |> TypeWithMetadata.toValueMap,
      outputSelection: "",
    };
    // TODO: This should probably come with a validation or something.
    let updateInputs =
        (
          t: t,
          inputValues: inputValues,
          key: string,
          onUpdate: option(Value.t) => option(Value.t),
        ) => {
      ValueMap.update(inputValues.inputs, key, onUpdate);
    };
  };

  let run = (inputs: inputValues, f) => f(inputs);
};

module InputValues = {
  type t = Model.inputValues;
};

module OutputValues = {
  type t = ValueMap.t;
};