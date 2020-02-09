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
  let fromArray = (r): t => MS.fromArray(r);
  let values = (t: t) => t |> MS.valuesToArray;
  let update = MS.update;
  let toArray = MS.toArray;
  let fromOptionalMap = (t: MS.t(option(Value.t))): t =>
    MS.keep(t, (_, d) => E.O.isSome(d))
    ->MS.map(d => E.O.toExn("This should not have happened", d));
  let fromOptionalArray = (r): t => MS.fromArray(r) |> fromOptionalMap;
};

module TypeWithMetadata = {
  // TODO: Figure out a better name for assumptionType
  type assumptionType =
    | PRIMARY_INPUT
    | ASSUMPTION;

  type t = {
    id: string,
    name: string,
    description: option(string),
    type_: Type.t,
    assumptionType,
  };

  type ts = array(t);

  // TODO: Change default here
  let currentYear = {
    id: "currentyear",
    name: "Current Year",
    description: None,
    type_: FloatPoint({default: None, min: None, max: None}),
    assumptionType: ASSUMPTION,
  };

  let make =
      (
        ~name,
        ~type_,
        ~id=name,
        ~description=None,
        ~assumptionType=PRIMARY_INPUT,
        (),
      ) => {
    id,
    name,
    type_,
    description,
    assumptionType,
  };
};

module Model = {
  type t = {
    name: string,
    author: string,
    inputTypes: array(TypeWithMetadata.t),
    outputTypes: array(TypeWithMetadata.t),
  };

  module InputTypes = {
    let keys = (t: t) =>
      t.inputTypes |> E.A.fmap((r: TypeWithMetadata.t) => r.name);
  };
};

module Combo = {
  type combo = {
    model: Model.t,
    inputValues: ValueMap.t,
    outputValues: ValueMap.t,
  };

  module InputValues = {
    let defaults = (t: Model.t) =>
      t.inputTypes
      |> E.A.fmap((o: TypeWithMetadata.t) =>
           (o.name, Type.default(o.type_))
         )
      |> ValueMap.fromOptionalArray;

    let isValid = (t: combo) =>
      t.model
      |> Model.InputTypes.keys
      |> E.A.fmap(ValueMap.get(t.inputValues))
      |> Belt.Array.some(_, E.O.isNone);

    let update =
        (
          t: combo,
          key: string,
          onUpdate: option(Value.t) => option(Value.t),
        ) =>
      ValueMap.update(t.inputValues, key, onUpdate);
  };

  let run = (t: combo, f): ValueMap.t => f(t.inputValues);
};