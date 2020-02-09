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
};

module ValueMap = {
  module MS = Belt.Map.String;
  module Combination = {
    type t = {
      typeWithMetadata: TypeWithMetadata.t,
      value: option(Value.t),
    };
    let make = (typeWithMetadata, value) => {typeWithMetadata, value};
    let makeWithDefaults = typeWithMetadata => {
      typeWithMetadata,
      value: Type.default(typeWithMetadata.type_),
    };
  };
  type t = MS.t(Combination.t);
  let get = MS.get;
  let keys = MS.keysToArray;
  let map = MS.map;
  let fromArray = MS.fromArray;
  let values = t =>
    t |> MS.valuesToArray |> Array.map((r: Combination.t) => r.value);
  let types = t =>
    t
    |> MS.valuesToArray
    |> Array.map((r: Combination.t) => r.typeWithMetadata);

  let fromTypesWithMetadata = (c: array(TypeWithMetadata.t)) =>
    c->Belt.Array.map((b: TypeWithMetadata.t) =>
      (b.name, Combination.makeWithDefaults(b))
    )
    |> fromArray;

  let getValue = (t: t, key: MS.key) =>
    t->MS.get(key)->Belt.Option.flatMap(r => r.value);

  let getType = (t: t, key: MS.key) =>
    t->MS.get(key)->Belt.Option.map(r => r.typeWithMetadata);
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

  let toInputDefaults = (t: t): inputValues => {
    inputs: t.inputTypes |> Array.of_list |> ValueMap.fromTypesWithMetadata,
    outputSelection: "",
  };

  let run = (inputs: inputValues, f) => f(inputs);
};

module InputValues = {
  type t = Model.inputValues;
  let update = (t, str, newValue) => t |> 
};

module OutputValues = {
  type t = ValueMap.t;
};