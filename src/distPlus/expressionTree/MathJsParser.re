type inputVars = Belt.Map.String.t(ExpressionTypes.ExpressionTree.node);

module MathJsonToMathJsAdt = {
  type arg =
    | Symbol(string)
    | Value(float)
    | Fn(fn)
    | Array(array(arg))
    | Object(Js.Dict.t(arg))
  and fn = {
    name: string,
    args: array(arg),
  };

  let rec run = (j: Js.Json.t) =>
    Json.Decode.(
      switch (field("mathjs", string, j)) {
      | "FunctionNode" =>
        let args = j |> field("args", array(run));
        let name = j |> optional(field("fn", field("name", string)));
        name |> E.O.fmap(name => Fn({name, args: args |> E.A.O.concatSomes}));
      | "OperatorNode" =>
        let args = j |> field("args", array(run));
        Some(
          Fn({
            name: j |> field("fn", string),
            args: args |> E.A.O.concatSomes,
          }),
        );
      | "ConstantNode" =>
        optional(field("value", Json.Decode.float), j)
        |> E.O.fmap(r => Value(r))
      | "ParenthesisNode" => j |> field("content", run)
      | "ObjectNode" =>
        let properties = j |> field("properties", dict(run));
        Js.Dict.entries(properties)
        |> E.A.fmap(((key, value)) => value |> E.O.fmap(v => (key, v)))
        |> E.A.O.concatSomes
        |> Js.Dict.fromArray
        |> (r => Some(Object(r)));
      | "ArrayNode" =>
        let items = field("items", array(run), j);
        Some(Array(items |> E.A.O.concatSomes));
      | "SymbolNode" => Some(Symbol(field("name", string, j)))
      | n =>
        Js.log3("Couldn't parse mathjs node", j, n);
        None;
      }
    );
};

module MathAdtToDistDst = {
  open MathJsonToMathJsAdt;

  let handleSymbol = (inputVars: inputVars, sym) => {
    switch (Belt.Map.String.get(inputVars, sym)) {
    | Some(s) => Ok(s)
    | None => Error("Couldn't find symbol " ++ sym)
    };
  };

  module MathAdtCleaner = {
    let transformWithSymbol = (f: float, s: string) =>
      switch (s) {
      | "K"
      | "k" => Some(f *. 1000.)
      | "M"
      | "m" => Some(f *. 1000000.)
      | "B"
      | "b" => Some(f *. 1000000000.)
      | "T"
      | "t" => Some(f *. 1000000000000.)
      | _ => None
      };

    let rec run =
      fun
      | Fn({name: "multiply", args: [|Value(f), Symbol(s)|]}) as doNothing =>
        transformWithSymbol(f, s)
        |> E.O.fmap(r => Value(r))
        |> E.O.default(doNothing)
      | Fn({name: "unaryMinus", args: [|Value(f)|]}) => Value((-1.0) *. f)
      | Fn({name, args}) => Fn({name, args: args |> E.A.fmap(run)})
      | Array(args) => Array(args |> E.A.fmap(run))
      | Symbol(s) => Symbol(s)
      | Value(v) => Value(v)
      | Object(v) =>
        Object(
          v
          |> Js.Dict.entries
          |> E.A.fmap(((key, value)) => (key, run(value)))
          |> Js.Dict.fromArray,
        );
  };

  let lognormal:
    array(arg) => result(ExpressionTypes.ExpressionTree.node, string) =
    fun
    | [|Value(mu), Value(sigma)|] =>
      Ok(`SymbolicDist(`Lognormal({mu, sigma})))
    | [|Object(o)|] => {
        let g = Js.Dict.get(o);
        switch (g("mean"), g("stdev"), g("mu"), g("sigma")) {
        | (Some(Value(mean)), Some(Value(stdev)), _, _) =>
          Ok(
            `SymbolicDist(
              SymbolicDist.Lognormal.fromMeanAndStdev(mean, stdev),
            ),
          )
        | (_, _, Some(Value(mu)), Some(Value(sigma))) =>
          Ok(`SymbolicDist(`Lognormal({mu, sigma})))
        | _ => Error("Lognormal distribution would need mean and stdev")
        };
      }
    | _ => Error("Wrong number of variables in lognormal distribution");

  let to_: array(arg) => result(ExpressionTypes.ExpressionTree.node, string) =
    fun
    | [|Value(low), Value(high)|] when low <= 0.0 && low < high => {
        Ok(`SymbolicDist(SymbolicDist.Normal.from90PercentCI(low, high)));
      }
    | [|Value(low), Value(high)|] when low < high => {
        Ok(
          `SymbolicDist(SymbolicDist.Lognormal.from90PercentCI(low, high)),
        );
      }
    | [|Value(_), Value(_)|] =>
      Error("Low value must be less than high value.")
    | _ => Error("Wrong number of variables in lognormal distribution");

  let exponential:
    array(arg) => result(ExpressionTypes.ExpressionTree.node, string) =
    fun
    | [|Value(rate)|] => Ok(`SymbolicDist(`Exponential({rate: rate})))
    | _ => Error("Wrong number of variables in Exponential distribution");

  let triangular:
    array(arg) => result(ExpressionTypes.ExpressionTree.node, string) =
    fun
    | [|Value(low), Value(medium), Value(high)|]
        when low < medium && medium < high =>
      Ok(`SymbolicDist(`Triangular({low, medium, high})))
    | [|Value(_), Value(_), Value(_)|] =>
      Error("Triangular values must be increasing order")
    | _ => Error("Wrong number of variables in triangle distribution");

  let multiModal =
      (
        args: array(result(ExpressionTypes.ExpressionTree.node, string)),
        weights: option(array(float)),
      ) => {
    let weights = weights |> E.O.default([||]);

    /*let dists:  =
      args
      |> E.A.fmap(
           fun
          | Ok(a) => a
          | Error(e) => Error(e)
          );*/

    let firstWithError = args |> Belt.Array.getBy(_, Belt.Result.isError);
    let withoutErrors = args |> E.A.fmap(E.R.toOption) |> E.A.O.concatSomes;

    switch (firstWithError) {
    | Some(Error(e)) => Error(e)
    | None when withoutErrors |> E.A.length == 0 =>
      Error("Multimodals need at least one input")
    | _ =>
      let components =
        withoutErrors
        |> E.A.fmapi((index, t) => {
             let w = weights |> E.A.get(_, index) |> E.O.default(1.0);

             `VerticalScaling((`Multiply, t, `SymbolicDist(`Float(w))));
           });

      let pointwiseSum =
        components
        |> Js.Array.sliceFrom(1)
        |> E.A.fold_left(
             (acc, x) => {`PointwiseCombination((`Add, acc, x))},
             E.A.unsafe_get(components, 0),
           );

      Ok(`Normalize(pointwiseSum));
    };
  };

  let operationParser =
      (
        name: string,
        args: result(array(ExpressionTypes.ExpressionTree.node), string),
      ) => {
    let toOkAlgebraic = r => Ok(`AlgebraicCombination(r));
    let toOkPointwise = r => Ok(`PointwiseCombination(r));
    let toOkTruncate = r => Ok(`Truncate(r));
    let toOkFloatFromDist = r => Ok(`FloatFromDist(r));
    args
    |> E.R.bind(_, args => {
         switch (name, args) {
         | ("add", [|l, r|]) => toOkAlgebraic((`Add, l, r))
         | ("add", _) => Error("Addition needs two operands")
         | ("subtract", [|l, r|]) => toOkAlgebraic((`Subtract, l, r))
         | ("subtract", _) => Error("Subtraction needs two operands")
         | ("multiply", [|l, r|]) => toOkAlgebraic((`Multiply, l, r))
         | ("multiply", _) => Error("Multiplication needs two operands")
         | ("dotMultiply", [|l, r|]) => toOkPointwise((`Multiply, l, r))
         | ("dotMultiply", _) =>
           Error("Dotwise multiplication needs two operands")
         | ("rightLogShift", [|l, r|]) => toOkPointwise((`Add, l, r))
         | ("rightLogShift", _) =>
           Error("Dotwise addition needs two operands")
         | ("divide", [|l, r|]) => toOkAlgebraic((`Divide, l, r))
         | ("divide", _) => Error("Division needs two operands")
         | ("pow", _) => Error("Exponentiation is not yet supported.")
         | ("leftTruncate", [|d, `SymbolicDist(`Float(lc))|]) =>
           toOkTruncate((Some(lc), None, d))
         | ("leftTruncate", _) =>
           Error(
             "leftTruncate needs two arguments: the expression and the cutoff",
           )
         | ("rightTruncate", [|d, `SymbolicDist(`Float(rc))|]) =>
           toOkTruncate((None, Some(rc), d))
         | ("rightTruncate", _) =>
           Error(
             "rightTruncate needs two arguments: the expression and the cutoff",
           )
         | (
             "truncate",
             [|d, `SymbolicDist(`Float(lc)), `SymbolicDist(`Float(rc))|],
           ) =>
           toOkTruncate((Some(lc), Some(rc), d))
         | ("truncate", _) =>
           Error(
             "truncate needs three arguments: the expression and both cutoffs",
           )
         | ("pdf", [|d, `SymbolicDist(`Float(v))|]) =>
           toOkFloatFromDist((`Pdf(v), d))
         | ("cdf", [|d, `SymbolicDist(`Float(v))|]) =>
           toOkFloatFromDist((`Cdf(v), d))
         | ("inv", [|d, `SymbolicDist(`Float(v))|]) =>
           toOkFloatFromDist((`Inv(v), d))
         | ("mean", [|d|]) => toOkFloatFromDist((`Mean, d))
         | ("sample", [|d|]) => toOkFloatFromDist((`Sample, d))
         | _ => Error("This type not currently supported")
         }
       });
  };

  let functionParser = (nodeParser, name, args) => {
    let parseArgs = () =>
      args |> E.A.fmap(nodeParser) |> E.A.R.firstErrorOrOpen;
    switch (name) {
    | "normal" | "uniform" | "beta" | "caucy" =>
      parseArgs()
      |> E.R.fmap(
           (
             args: array(ExpressionTypes.ExpressionTree.node),
           ) =>
           `CallableFunction((name, args))
         )
    | "mm" =>
      let weights =
        args
        |> E.A.last
        |> E.O.bind(
             _,
             fun
             | Array(values) => Some(values)
             | _ => None,
           )
        |> E.O.fmap(o =>
             o
             |> E.A.fmap(
                  fun
                  | Value(r) => Some(r)
                  | _ => None,
                )
             |> E.A.O.concatSomes
           );
      let possibleDists =
        E.O.isSome(weights)
          ? Belt.Array.slice(args, ~offset=0, ~len=E.A.length(args) - 1)
          : args;
      let dists = possibleDists |> E.A.fmap(nodeParser);
      multiModal(dists, weights);
    | "add"
    | "subtract"
    | "multiply"
    | "dotMultiply"
    | "rightLogShift"
    | "divide"
    | "pow"
    | "leftTruncate"
    | "rightTruncate"
    | "truncate"
    | "mean"
    | "inv"
    | "sample"
    | "cdf"
    | "pdf" => operationParser(name, parseArgs())
    | n => Error(n ++ "(...) is not currently supported")
    };
  };

  let rec nodeParser:
    (inputVars, MathJsonToMathJsAdt.arg) =>
    result(ExpressionTypes.ExpressionTree.node, string) =
    inputVars =>
      fun
      | Value(f) => Ok(`SymbolicDist(`Float(f)))
      | Symbol(s) => handleSymbol(inputVars, s)
      | Fn({name, args}) =>
        functionParser(nodeParser(inputVars), name, args)
      | _ => {
          Error("This type not currently supported");
        };

  let topLevel = inputVars =>
    fun
    | Value(_) as r => nodeParser(inputVars, r)
    | Fn(_) as r => nodeParser(inputVars, r)
    | Array(_) => Error("Array not valid as top level")
    | Symbol(s) => handleSymbol(inputVars, s)
    | Object(_) => Error("Object not valid as top level");

  let run =
      (inputVars, r): result(ExpressionTypes.ExpressionTree.node, string) =>
    r |> MathAdtCleaner.run |> topLevel(inputVars);
};

/* The MathJs parser doesn't support '.+' syntax, but we want it because it
   would make sense with '.*'. Our workaround is to change this to >>>, which is
   logShift in mathJS. We don't expect to use logShift anytime soon, so this tradeoff
   seems fine.
   */
let pointwiseToRightLogShift = Js.String.replaceByRe([%re "/\.\+/g"], ">>>");

let fromString2 = (inputVars: inputVars, str) => {
  /* We feed the user-typed string into Mathjs.parseMath,
       which returns a JSON with (hopefully) a single-element array.
       This array element is the top-level node of a nested-object tree
       representing the functions/arguments/values/etc. in the string.

       The function MathJsonToMathJsAdt then recursively unpacks this JSON into a typed data structure we can use.
       Inside of this function, MathAdtToDistDst is called whenever a distribution function is encountered.
     */
  let mathJsToJson = str |> pointwiseToRightLogShift |> Mathjs.parseMath;
  let mathJsParse =
    E.R.bind(mathJsToJson, r => {
      switch (MathJsonToMathJsAdt.run(r)) {
      | Some(r) => Ok(r)
      | None => Error("MathJsParse Error")
      }
    });

  let value = E.R.bind(mathJsParse, MathAdtToDistDst.run(inputVars));
  value;
};

let fromString = (str, vars: inputVars) => {
  fromString2(vars, str);
};
