type node = ExpressionTypes.ExpressionTree.node;
let getFloat = ExpressionTypes.ExpressionTree.getFloat;

type samplingDist = [
  | `SymbolicDist(SymbolicTypes.symbolicDist)
  | `RenderedDist(DistTypes.shape)
];

type hashType = array((string, _type))
and _type = [
  | `Float
  | `SamplingDistribution
  | `RenderedDistribution
  | `Array(_type)
  | `Hash(hashType)
];

type hashTypedValue = array((string, typedValue))
and typedValue = [
  | `Float(float)
  | `RenderedDist(DistTypes.shape)
  | `SamplingDist(samplingDist)
  | `Array(array(typedValue))
  | `Hash(hashTypedValue)
];

type _function = {
  name: string,
  inputTypes: array(_type),
  outputType: _type,
  run: array(typedValue) => result(node, string),
  shouldCoerceTypes: bool,
};

type functions = array(_function);
type inputNodes = array(node);

module TypedValue = {
  let rec toString: typedValue => string =
    fun
    | `SamplingDist(_) => "[sampling dist]"
    | `RenderedDist(_) => "[rendered Shape]"
    | `Float(f) => "Float: " ++ Js.Float.toString(f)
    | `Array(a) =>
      "[" ++ (a |> E.A.fmap(toString) |> Js.String.concatMany(_, ",")) ++ "]"
    | `Hash(v) =>
      "{"
      ++ (
        v
        |> E.A.fmap(((name, value)) => name ++ ":" ++ toString(value))
        |> Js.String.concatMany(_, ",")
      )
      ++ "}";

  let rec fromNode = (node: node): result(typedValue, string) =>
    switch (ExpressionTypes.ExpressionTree.toFloatIfNeeded(node)) {
    | `SymbolicDist(`Float(r)) => Ok(`Float(r))
    | `SymbolicDist(s) => Ok(`SamplingDist(`SymbolicDist(s)))
    | `RenderedDist(s) => Ok(`RenderedDist(s))
    | `Array(r) =>
      r
      |> E.A.fmap(fromNode)
      |> E.A.R.firstErrorOrOpen
      |> E.R.fmap(r => `Array(r))
    | `Hash(hash) =>
      hash
      |> E.A.fmap(((name, t)) => fromNode(t) |> E.R.fmap(r => (name, r)))
      |> E.A.R.firstErrorOrOpen
      |> E.R.fmap(r => `Hash(r))
    | e => Error("Wrong type: " ++ ExpressionTreeBasic.toString(e))
    };

  // todo: Arrays and hashes
  let rec fromNodeWithTypeCoercion = (evaluationParams, _type: _type, node) => {
    switch (_type, node) {
    | (`Float, _) =>
      switch (getFloat(node)) {
      | Some(a) => Ok(`Float(a))
      | _ => Error("Type Error: Expected float.")
      }
    | (`SamplingDistribution, _) =>
      PTypes.SamplingDistribution.renderIfIsNotSamplingDistribution(
        evaluationParams,
        node,
      )
      |> E.R.bind(_, fromNode)
    | (`RenderedDistribution, _) =>
      ExpressionTypes.ExpressionTree.Render.render(evaluationParams, node)
      |> E.R.bind(_, fromNode)
    | (`Array(_type), `Array(b)) =>
      b
      |> E.A.fmap(fromNodeWithTypeCoercion(evaluationParams, _type))
      |> E.A.R.firstErrorOrOpen
      |> E.R.fmap(r => `Array(r))
    | (`Hash(named), `Hash(r)) =>
      let keyValues =
        named
        |> E.A.fmap(((name, intendedType)) =>
             (
               name,
               intendedType,
               ExpressionTypes.ExpressionTree.Hash.getByName(r, name),
             )
           );
      let typedHash =
        keyValues
        |> E.A.fmap(((name, intendedType, optionNode)) =>
             switch (optionNode) {
             | Some(node) =>
               fromNodeWithTypeCoercion(evaluationParams, intendedType, node)
               |> E.R.fmap(node => (name, node))
             | None => Error("Hash parameter not present in hash.")
             }
           )
        |> E.A.R.firstErrorOrOpen
        |> E.R.fmap(r => `Hash(r));
      typedHash;
    | _ => Error("fromNodeWithTypeCoercion error, sorry.")
    };
  };

  let toFloat: typedValue => result(float, string) =
    fun
    | `Float(x) => Ok(x)
    | _ => Error("Not a float");

  let toArray: typedValue => result(array('a), string) =
    fun
    | `Array(x) => Ok(x)
    | _ => Error("Not an array");

  let toNamed: typedValue => result(hashTypedValue, string) =
    fun
    | `Hash(x) => Ok(x)
    | _ => Error("Not a named item");

  let toDist: typedValue => result(node,string) =
    fun
    | `SamplingDist(`SymbolicDist(c)) => Ok(`SymbolicDist(c))
    | `SamplingDist(`RenderedDist(c)) => Ok(`RenderedDist(c))
    | `RenderedDist(c) => Ok(`RenderedDist(c))
    | `Float(x) => Ok(`SymbolicDist(`Float(x)))
    | x => Error("Cannot be converted into a distribution: " ++ toString(x));
};

module Function = {
  type t = _function;
  type ts = functions;

  module T = {
    let make =
        (~name, ~inputTypes, ~outputType, ~run, ~shouldCoerceTypes=true, _): t => {
      name,
      inputTypes,
      outputType,
      run,
      shouldCoerceTypes,
    };

    let _inputLengthCheck = (inputNodes: inputNodes, t: t) => {
      let expectedLength = E.A.length(t.inputTypes);
      let actualLength = E.A.length(inputNodes);
      expectedLength == actualLength
        ? Ok(inputNodes)
        : Error(
            "Wrong number of inputs. Expected"
            ++ (expectedLength |> E.I.toString)
            ++ ". Got:"
            ++ (actualLength |> E.I.toString),
          );
    };

    let _coerceInputNodes =
        (evaluationParams, inputTypes, shouldCoerce, inputNodes) =>
      Belt.Array.zip(inputTypes, inputNodes)
      |> E.A.fmap(((def, input)) =>
           shouldCoerce
             ? TypedValue.fromNodeWithTypeCoercion(
                 evaluationParams,
                 def,
                 input,
               )
             : TypedValue.fromNode(input)
         )
      |> E.A.R.firstErrorOrOpen;

    let inputsToTypedValues =
        (
          evaluationParams: ExpressionTypes.ExpressionTree.evaluationParams,
          inputNodes: inputNodes,
          t: t,
        ) => {
      _inputLengthCheck(inputNodes, t)
      ->E.R.bind(
          _coerceInputNodes(
            evaluationParams,
            t.inputTypes,
            t.shouldCoerceTypes,
          ),
        );
    };

    let run =
        (
          evaluationParams: ExpressionTypes.ExpressionTree.evaluationParams,
          inputNodes: inputNodes,
          t: t,
        ) => {
      inputsToTypedValues(evaluationParams, inputNodes, t)->E.R.bind(t.run)
      |> (
        fun
        | Ok(i) => Ok(i)
        | Error(r) => {
            Error("Function " ++ t.name ++ " error: " ++ r);
          }
      );
    };
  };

  module Ts = {
    let findByName = (ts: ts, n: string) =>
      ts |> Belt.Array.getBy(_, ({name}) => name == n);

    let findByNameAndRun = (ts: ts, n: string, evaluationParams, inputTypes) =>
      findByName(ts, n) |> E.O.fmap(T.run(evaluationParams, inputTypes));
  };
};
