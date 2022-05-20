type expressionValue = ReducerInterface_ExpressionValue.expressionValue
type error = DistributionTypes.error
type argumentError = DistributionTypes.ArgumentError.t

let expressionValueToType = (value: expressionValue): DistributionTypes.expressionType =>
  switch value {
  | EvArray(_) => ArrayType
  | EvArrayString(_) => ArrayStringType
  | EvBool(_) => BoolType
  | EvCall(_) => CallType
  | EvDistribution(_) => DistributionType
  | EvLambda(_) => LambdaType
  | EvNumber(_) => NumberType
  | EvRecord(_) => RecordType
  | EvString(_) => StringType
  | EvSymbol(_) => SymbolType
  }

module Primitive = {
  let distribution = (argument: expressionValue): result<DistributionTypes.genericDist, argumentError> =>
    switch argument {
    | EvDistribution(dist) => Ok(dist)
    | _ => Error(WrongTypeError(DistributionType, expressionValueToType(argument)))
    }

  let finite = (argument: expressionValue): result<SafeFloat.finite, argumentError> =>
    switch argument {
    | EvNumber(num) => 
        switch SafeFloat.Finite.make(num) {
        | Some(safeNum) => Ok(safeNum)
        | None => Error(MustBeFinite)
      }
    | _ => Error(WrongTypeError(NumberType, expressionValueToType(argument)))
    }

  let positive = (argument: expressionValue): result<SafeFloat.positive, argumentError> =>
    switch argument {
    | EvNumber(num) => 
        switch SafeFloat.Positive.make(num) {
        | Some(safeNum) => Ok(safeNum)
        | None => Error(MustBePositive)
      }
    | _ => Error(WrongTypeError(NumberType, expressionValueToType(argument)))
  }
}

module Functions = {
  let function1 = (
    f: 'a => 'b,
    parseArg1: expressionValue => result<'a, argumentError>,
    args: array<expressionValue>,
  ): result<'b, argumentError> =>
    switch args {
    | [arg1] => E.R.fmap(f, parseArg1(arg1))
    | _ => Error(IncorrectNumberOfArgumentsError(1, E.A.length(args)))
    }


  let function2Bind = (
    f: ('a, 'b) => result<'c, argumentError>,
    parseArg1: expressionValue => result<'a, argumentError>,
    parseArg2: expressionValue => result<'b, argumentError>,
    args: array<expressionValue>,
  ): result<'c, argumentError> =>
    switch args {
    | [arg1, arg2] => E.R.merge(parseArg1(arg1), parseArg2(arg2)) -> E.R.bind(((a, b)) => f(a, b))
    | _ => Error(IncorrectNumberOfArgumentsError(2, E.A.length(args)))
    }

  let function2 = (
    f: ('a, 'b) => 'c,
    parseArg1: expressionValue => result<'a, argumentError>,
    parseArg2: expressionValue => result<'b, argumentError>,
    args: array<expressionValue>,
  ): result<'c, argumentError> =>
    function2Bind((a, b) => Ok(f(a, b)), parseArg1, parseArg2, args)

  let function3Bind = (
    f: ('a, 'b, 'c) => result<'d, argumentError>,
    parseArg1: expressionValue => result<'a, argumentError>,
    parseArg2: expressionValue => result<'b, argumentError>,
    parseArg3: expressionValue => result<'c, argumentError>,
    args: array<expressionValue>,
  ): result<'d, argumentError> =>
    switch args {
    | [arg1, arg2, arg3] => E.R.merge3(parseArg1(arg1), parseArg2(arg2), parseArg3(arg3)) -> E.R.bind(((a, b, c)) => f(a, b, c))
    | _ => Error(IncorrectNumberOfArgumentsError(2, E.A.length(args)))
    }
}

type function = Function(string, array<expressionValue> => result<SymbolicDistTypes.symbolicDist, argumentError>)

let allFunctions: array<function> = 
  [ Function("exponential", Functions.function1( SymbolicDist.Exponential.make, Primitive.positive))
  , Function("normal", Functions.function2( SymbolicDist.Normal.make, Primitive.finite, Primitive.positive,))
  , Function("uniform", Functions.function2Bind( SymbolicDist.Uniform.make, Primitive.finite, Primitive.finite,))
  , Function("beta", Functions.function2( SymbolicDist.Beta.make, Primitive.positive, Primitive.positive,))
  , Function("lognormal", Functions.function2( SymbolicDist.Lognormal.make, Primitive.finite, Primitive.positive,))
  , Function("cauchy", Functions.function2( SymbolicDist.Cauchy.make, Primitive.finite, Primitive.positive,))
  , Function("gamma", Functions.function2( SymbolicDist.Gamma.make, Primitive.positive, Primitive.positive,))
  , Function("to", Functions.function2Bind( SymbolicDist.From90thPercentile.make, Primitive.positive, Primitive.positive,))
  , Function("triangular", Functions.function3Bind( SymbolicDist.Triangular.make, Primitive.finite, Primitive.finite, Primitive.finite,))
]
