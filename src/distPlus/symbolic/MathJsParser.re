// todo: rename to SymbolicParser

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
        Some(
          Fn({
            name: j |> field("fn", field("name", string)),
            args: args |> E.A.O.concatSomes,
          }),
        );
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

  module MathAdtCleaner = {
    let transformWithSymbol = (f: float, s: string) =>
      switch (s) {
      | "K"
      | "k" => f *. 1000.
      | "M"
      | "m" => f *. 1000000.
      | "B"
      | "b" => f *. 1000000000.
      | "T"
      | "t" => f *. 1000000000000.
      | _ => f
      };

    let rec run =
      fun
      | Fn({name: "multiply", args: [|Value(f), Symbol(s)|]}) =>
        Value(transformWithSymbol(f, s))
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

  let normal: array(arg) => result(SymbolicDist.bigDist, string) =
    fun
    | [|Value(mean), Value(stdev)|] =>
      Ok(`Simple(`Normal({mean, stdev})))
    | _ => Error("Wrong number of variables in normal distribution");

  let lognormal: array(arg) => result(SymbolicDist.bigDist, string) =
    fun
    | [|Value(mu), Value(sigma)|] => Ok(`Simple(`Lognormal({mu, sigma})))
    | [|Object(o)|] => {
        let g = Js.Dict.get(o);
        switch (g("mean"), g("stdev"), g("mu"), g("sigma")) {
        | (Some(Value(mean)), Some(Value(stdev)), _, _) =>
          Ok(`Simple(SymbolicDist.Lognormal.fromMeanAndStdev(mean, stdev)))
        | (_, _, Some(Value(mu)), Some(Value(sigma))) =>
          Ok(`Simple(`Lognormal({mu, sigma})))
        | _ => Error("Lognormal distribution would need mean and stdev")
        };
      }
    | _ => Error("Wrong number of variables in lognormal distribution");

  let to_: array(arg) => result(SymbolicDist.bigDist, string) =
    fun
    | [|Value(low), Value(high)|] when low <= 0.0 && low < high=> {
        Ok(`Simple(SymbolicDist.Normal.from90PercentCI(low, high)));
      }
    | [|Value(low), Value(high)|] when low < high => {
        Ok(`Simple(SymbolicDist.Lognormal.from90PercentCI(low, high)));
      }
    | [|Value(_), Value(_)|] =>
      Error("Low value must be less than high value.")
    | _ => Error("Wrong number of variables in lognormal distribution");

  let uniform: array(arg) => result(SymbolicDist.bigDist, string) =
    fun
    | [|Value(low), Value(high)|] => Ok(`Simple(`Uniform({low, high})))
    | _ => Error("Wrong number of variables in lognormal distribution");

  let beta: array(arg) => result(SymbolicDist.bigDist, string) =
    fun
    | [|Value(alpha), Value(beta)|] => Ok(`Simple(`Beta({alpha, beta})))
    | _ => Error("Wrong number of variables in lognormal distribution");

  let exponential: array(arg) => result(SymbolicDist.bigDist, string) =
    fun
    | [|Value(rate)|] => Ok(`Simple(`Exponential({rate: rate})))
    | _ => Error("Wrong number of variables in Exponential distribution");

  let cauchy: array(arg) => result(SymbolicDist.bigDist, string) =
    fun
    | [|Value(local), Value(scale)|] =>
      Ok(`Simple(`Cauchy({local, scale})))
    | _ => Error("Wrong number of variables in cauchy distribution");

  let triangular: array(arg) => result(SymbolicDist.bigDist, string) =
    fun
    | [|Value(low), Value(medium), Value(high)|] =>
      Ok(`Simple(`Triangular({low, medium, high})))
    | _ => Error("Wrong number of variables in triangle distribution");

  let multiModal =
      (
        args: array(result(SymbolicDist.bigDist, string)),
        weights: option(array(float)),
      ) => {
    let weights = weights |> E.O.default([||]);
    let dists =
      args
      |> E.A.fmap(
           fun
           | Ok(`Simple(n)) => Ok(n)
           | Error(e) => Error(e)
           | Ok(k) => Error(SymbolicDist.toString(k)),
         );
    let firstWithError = dists |> Belt.Array.getBy(_, Belt.Result.isError);
    let withoutErrors = dists |> E.A.fmap(E.R.toOption) |> E.A.O.concatSomes;
    switch (firstWithError) {
    | Some(Error(e)) => Error(e)
    | None when withoutErrors |> E.A.length == 0 =>
      Error("Multimodals need at least one input")
    | _ =>
      withoutErrors
      |> E.A.fmapi((index, item) =>
           (item, weights |> E.A.get(_, index) |> E.O.default(1.0))
         )
      |> (r => Ok(`PointwiseCombination(r)))
    };
  };

  let arrayParser = (args:array(arg)):result(SymbolicDist.bigDist, string) => {
    let samples = args
    |> E.A.fmap(
          fun
          | Value(n) => Some(n)
          | _ => None
        )
    |> E.A.O.concatSomes
    let outputs = Samples.T.fromSamples(samples);
    let pdf = outputs.shape |> E.O.bind(_,Distributions.Shape.T.toContinuous)
    let shape = pdf |> E.O.fmap(pdf => {
      let _pdf = Distributions.Continuous.T.scaleToIntegralSum(~cache=None, ~intendedSum=1.0, pdf);
      let cdf = Distributions.Continuous.T.integral(~cache=None, _pdf);
      SymbolicDist.ContinuousShape.make(_pdf, cdf)
    })
    switch(shape){
      | Some(s) => Ok(`Simple(`ContinuousShape(s)))
      | None => Error("Rendering did not work")
    }
  }


  let rec functionParser = (r): result(SymbolicDist.bigDist, string) =>
    r
    |> (
      fun
      | Fn({name: "normal", args}) => normal(args)
      | Fn({name: "lognormal", args}) => lognormal(args)
      | Fn({name: "uniform", args}) => uniform(args)
      | Fn({name: "beta", args}) => beta(args)
      | Fn({name: "to", args}) => to_(args)
      | Fn({name: "exponential", args}) => exponential(args)
      | Fn({name: "cauchy", args}) => cauchy(args)
      | Fn({name: "triangular", args}) => triangular(args)
      | Value(f) => Ok(`Simple(`Float(f)))
      | Fn({name: "mm", args}) => {
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
          let dists = possibleDists |> E.A.fmap(functionParser);
          multiModal(dists, weights);
        }
      | Fn({name}) => Error(name ++ ": function not supported")
      | _ => {
          Error("This type not currently supported");
        }
    );

  let topLevel = (r): result(SymbolicDist.bigDist, string) =>
    r
    |> (
      fun
      | Fn(_) => functionParser(r)
      | Value(r) => Ok(`Simple(`Float(r)))
      | Array(r) => arrayParser(r)
      | Symbol(_) => Error("Symbol not valid as top level")
      | Object(_) => Error("Object not valid as top level")
    );

  let run = (r): result(SymbolicDist.bigDist, string) =>
    r |> MathAdtCleaner.run |> topLevel;
};

let fromString = str => {
  let mathJsToJson = Mathjs.parseMath(str);
  let mathJsParse =
    E.R.bind(mathJsToJson, r =>
      switch (MathJsonToMathJsAdt.run(r)) {
      | Some(r) => Ok(r)
      | None => Error("MathJsParse Error")
      }
    );
  let value = E.R.bind(mathJsParse, MathAdtToDistDst.run);
  value;
};