module Value = {
  type binaryConditional =
    | Selected(bool)
    | Unselected;

  type conditional = {
    name: string,
    truthValue: bool,
  };

  type t =
    | BinaryConditional(binaryConditional)
    | SelectSingle(string)
    | DateTime(MomentRe.Moment.t)
    | FloatPoint(float)
    | Probability(float)
    | Conditional(conditional)
    | GenericDistribution(DistributionTypes.genericDistribution)
    | TimeLimitedDomainCdf(TimeLimitedDomainCdf.t)
    | TimeLimitedDomainCdfLazy(
        (string => Types.ContinuousDistribution.t) => TimeLimitedDomainCdf.t,
      )
    | ConditionalArray(array(conditional))
    | FloatCdf(string);

  let to_string = (t: t) => {
    switch (t) {
    | BinaryConditional(binaryConditional) =>
      switch (binaryConditional) {
      | Selected(r) => r ? "True" : "False"
      | Unselected => ""
      }
    | SelectSingle(r) => r
    | FloatCdf(r) => r
    | GenericDistribution(_) => ""
    | TimeLimitedDomainCdf(_) => ""
    | TimeLimitedDomainCdfLazy(_) => ""
    | Probability(r) => (r *. 100. |> Js.Float.toFixed) ++ "%"
    | DateTime(r) => r |> MomentRe.Moment.defaultFormat
    | FloatPoint(r) => r |> Js.Float.toFixed
    | Conditional(r) => r.name
    | ConditionalArray(r) =>
      r |> E.A.fmap(r => r.name) |> Js.Array.joinWith(",")
    };
  };

  let display = (t: t) => {
    switch (t) {
    | BinaryConditional(binaryConditional) =>
      (
        switch (binaryConditional) {
        | Selected(r) => r ? "True" : "False"
        | Unselected => ""
        }
      )
      |> ReasonReact.string
    | SelectSingle(r) => r |> ReasonReact.string
    | ConditionalArray(r) => "Array" |> ReasonReact.string
    | Conditional(r) => r.name |> ReasonReact.string
    | GenericDistribution(r) =>
      let newDistribution =
        GenericDistribution.renderIfNeeded(~sampleCount=1000, r);
      switch (newDistribution) {
      | Some({generationSource: Shape(Mixed({continuous: n}))}) =>
        <div>
          <Chart height=100 data={n |> Shape.Continuous.toJs} />
          <Chart
            height=100
            data={n |> Shape.Continuous.toCdf |> Shape.Continuous.toJs}
          />
        </div>
      | None => "Something went wrong" |> ReasonReact.string
      | _ => <div />
      };
    | TimeLimitedDomainCdfLazy(_) => <div />
    | TimeLimitedDomainCdf(r) =>
      let cdf: Types.ContinuousDistribution.t =
        r.limitedDomainCdf.distribution;
      <>
        <Chart height=100 data={cdf |> Types.ContinuousDistribution.toJs} />
      </>;
    | FloatCdf(_) => <div />
    | Probability(r) =>
      (r *. 100. |> Js.Float.toFixed) ++ "%" |> ReasonReact.string
    | DateTime(r) => r |> MomentRe.Moment.defaultFormat |> ReasonReact.string
    | FloatPoint(r) => r |> Js.Float.toFixed |> ReasonReact.string
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
    | BinaryConditional
    | SelectSingle(selectSingle)
    | FloatPoint(withDefaultMinMax(float))
    | Probability(withDefault(float))
    | DateTime(withDefaultMinMax(MomentRe.Moment.t))
    | Year(withDefaultMinMax(float))
    | Conditionals(conditionals)
    | FloatCdf;

  let default = (t: t) =>
    switch (t) {
    | BinaryConditional => Some(Value.BinaryConditional(Unselected))
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
};

module Model = {
  type t = {
    name: string,
    description: string,
    author: string,
    version: string,
    inputTypes: array(TypeWithMetadata.t),
    outputTypes: array(TypeWithMetadata.t),
    run: combo => option(Value.t),
  }
  and combo = {
    model: t,
    inputValues: ValueMap.t,
    outputValues: ValueMap.t,
  };

  module InputTypes = {
    let keys = (t: t) =>
      t.inputTypes |> E.A.fmap((r: TypeWithMetadata.t) => r.id);
  };
};

module Combo = {
  type t = Model.combo;

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

    let toValueArray = (t: t) => {
      t.model.inputTypes
      |> E.A.fmap((r: TypeWithMetadata.t) =>
           ValueMap.get(t.inputValues, r.id)
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