module Value = {
  type conditional = {
    name: string,
    truthValue: bool,
  };

  type t =
    | SelectSingle(string)
    | DateTime(MomentRe.Moment.t)
    | FloatPoint(float)
    | Probability(float)
    | DistPlusIngredients(DistTypes.distPlusIngredients)
    | ConditionalArray(array(conditional))
    | FloatCdf(string);

  module ConditionalArray = {
    let get = (conditionals: array(conditional), name: string) =>
      Belt.Array.getBy(conditionals, (c: conditional) => c.name == name);
  };
};

module ValueCombination = {
  type pointsToEvenlySample = int;

  type dateTimeRange = {
    startTime: MomentRe.Moment.t,
    endTime: MomentRe.Moment.t,
    pointsWithin: int,
  };

  type floatPointRange = {
    startTime: float,
    endTime: float,
    pointsWithin: int,
  };

  type range('a) = {
    beginning: 'a,
    ending: 'a,
    pointsToEvenlySample,
  };

  type t =
    | SelectSingle
    | DateTime(range(MomentRe.Moment.t))
    | FloatPoint(range(MomentRe.Moment.t))
    | Probability(pointsToEvenlySample);
};

module ValueCluster = {
  type conditional = {
    name: string,
    truthValue: bool,
  };

  type pointsToEvenlySample = int;

  type dateTimeRange = {
    startTime: MomentRe.Moment.t,
    endTime: MomentRe.Moment.t,
    pointsWithin: int,
  };

  type floatPointRange = {
    startTime: float,
    endTime: float,
    pointsWithin: int,
  };

  type range('a) = {
    beginning: 'a,
    ending: 'a,
    pointsToEvenlySample,
  };

  type t =
    | SelectSingle([ | `combination | `item(string)])
    | DateTime(
        [
          | `combination(range(MomentRe.Moment.t))
          | `item(MomentRe.Moment.t)
        ],
      )
    | FloatPoint(
        [ | `combination(range(MomentRe.Moment.t)) | `item(string)],
      )
    | Probability([ | `item(string)])
    | DistPlusIngredients([ | `item(DistTypes.distPlusIngredients)])
    | ConditionalArray([ | `item(array(conditional))])
    | FloatCdf([ | `item(string)]);
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

  type conditionals = {
    defaults: array(Value.conditional),
    options: array(string),
  };

  let makeConditionals = (defaults, options): conditionals => {
    defaults,
    options,
  };

  type floatPoint = {validatations: list(float => bool)};

  type withDefaultMinMax('a) = {
    default: option('a),
    min: option('a),
    max: option('a),
  };

  type withDefault('a) = {default: option('a)};

  type t =
    | SelectSingle(selectSingle)
    | FloatPoint(withDefaultMinMax(float))
    | Probability(withDefault(float))
    | DateTime(withDefaultMinMax(MomentRe.Moment.t))
    | Year(withDefaultMinMax(float))
    | Conditionals(conditionals)
    | FloatCdf;

  let default = (t: t) =>
    switch (t) {
    | Conditionals(s) => Some(Value.ConditionalArray(s.defaults))
    | Year(r) => r.default->Belt.Option.map(p => Value.FloatPoint(p))
    | FloatPoint(r) => r.default->Belt.Option.map(p => Value.FloatPoint(p))
    | Probability(r) => r.default->Belt.Option.map(p => Value.Probability(p))
    | DateTime(r) => r.default->Belt.Option.map(p => Value.DateTime(p))
    | SelectSingle(r) =>
      r.default->Belt.Option.map(p => Value.SelectSingle(p))
    | FloatCdf => None
    };
};

module ValueMap = {
  module MS = Belt.Map.String;
  type t = MS.t(Value.t);
  let get = (t: t, s) => MS.get(t, s);
  let keys = MS.keysToArray;
  let map = MS.map;
  let fromArray = (r): t => MS.fromArray(r);
  let values = (t: t) => t |> MS.valuesToArray;
  let update = (t, k, v) => MS.update(t, k, _ => v);
  let toArray = MS.toArray;
  let fromOptionalMap = (t: MS.t(option(Value.t))): t =>
    MS.keep(t, (_, d) => E.O.isSome(d))
    ->MS.map(d => E.O.toExn("This should not have happened", d));
  let fromOptionalArray = (r): t => MS.fromArray(r) |> fromOptionalMap;
};

module ValueClusterMap = {
  module MS = Belt.Map.String;
  type t = MS.t(ValueCluster.t);
  let get = (t: t, s) => MS.get(t, s);
  let keys = MS.keysToArray;
  let map = MS.map;
  let fromArray = (r): t => MS.fromArray(r);
  let values = (t: t) => t |> MS.valuesToArray;
  let update = (t, k, v) => MS.update(t, k, _ => v);
  let toArray = MS.toArray;
  let fromOptionalMap = (t: MS.t(option(ValueCluster.t))): t =>
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

  let currentYear =
    make(
      ~id="currentYear",
      ~name="Current Day",
      ~description=None,
      ~type_=
        DateTime({
          default: Some(MomentRe.momentNow()),
          min: Some(MomentRe.momentNow()),
          max: Some(MomentRe.momentNow()),
        }),
      ~assumptionType=ASSUMPTION,
      (),
    );

  let age =
    make(
      ~id="age",
      ~name="Current Age",
      ~description=None,
      ~type_=
        FloatPoint({
          default: Some(40.0),
          min: Some(0.0),
          max: Some(100.0),
        }),
      ~assumptionType=PRIMARY_INPUT,
      (),
    );
};

module Model = {
  type t = {
    name: string,
    description: string,
    author: string,
    version: string,
    inputTypes: array(TypeWithMetadata.t),
    outputTypes: array(TypeWithMetadata.t),
    run: array(option(Value.t)) => option(Value.t),
  }
  and combo = {
    model: t,
    inputValues: ValueMap.t,
    outputValues: ValueMap.t,
  };

  module InputTypes = {
    let keys = (t: t) =>
      t.inputTypes |> E.A.fmap((r: TypeWithMetadata.t) => r.id);

    let getBy = (t: t, fn) => t.inputTypes |> E.A.getBy(_, fn);
  };
};

module Combo = {
  type t = Model.combo;
  type valueArray = array(option(Value.t));

  module InputValues = {
    let defaults = (t: Model.t) =>
      t.inputTypes
      |> E.A.fmap((o: TypeWithMetadata.t) => (o.id, Type.default(o.type_)))
      |> ValueMap.fromOptionalArray;

    let isValid = (t: t) =>
      t.model
      |> Model.InputTypes.keys
      |> E.A.fmap(ValueMap.get(t.inputValues))
      |> Belt.Array.some(_, E.O.isNone);

    let update = (t: t, key: string, onUpdate: option(Value.t)) =>
      ValueMap.update(t.inputValues, key, onUpdate);

    let toValueArray = (t: t): valueArray => {
      t.model.inputTypes
      |> E.A.fmap((r: TypeWithMetadata.t) =>
           t.inputValues->ValueMap.get(r.id)
         );
    };
  };

  let updateInputValue = (t: t, k, u) => {
    ...t,
    inputValues: InputValues.update(t, k, u),
  };

  let inputTypeValuePairs = (t: t) =>
    t.model.inputTypes
    |> E.A.fmap((i: TypeWithMetadata.t) =>
         (i, ValueMap.get(t.inputValues, i.id))
       );

  let fromModel = (t: Model.t): t => {
    model: t,
    inputValues: InputValues.defaults(t),
    outputValues: InputValues.defaults(t),
  };

  let run = (t: t, f): ValueMap.t => f(t.inputValues);
};