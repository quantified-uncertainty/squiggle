open Jstat;

type arg =
  | Value(float)
  | Fn(fn)
and fn = {
  name: string,
  args: array(arg),
};

let rec parseMathjs = (j: Js.Json.t) => {
  Json.Decode.(
    switch (field("mathjs", string, j)) {
    | "FunctionNode" =>
      let args = j |> field("args", array(parseMathjs));
      Some(
        Fn({
          name: j |> field("fn", field("name", string)),
          args: args |> E.A.O.concatSomes,
        }),
      );
    | "ConstantNode" => Some(Value(field("value", float, j)))
    | _ => None
    }
  );
};

let normal = (r): result(bigDist, string) =>
  r
  |> (
    fun
    | [|Value(mean), Value(stdev)|] => Ok(`Dist(`Normal({mean, stdev})))
    | _ => Error("Wrong number of variables in normal distribution")
  );

let rec toValue = (r): result(bigDist, string) =>
  r
  |> (
    fun
    | Value(_) => Error("Top level can't be value")
    | Fn({name: "normal", args}) => normal(args)
    | Fn({name: "mm", args}) => {
        let dists: array(dist) =
          args
          |> E.A.fmap(toValue)
          |> E.A.fmap(
               fun
               | Ok(`Dist(`Normal({mean, stdev}))) =>
                 Some(`Normal({mean, stdev}))
               | _ => None,
             )
          |> E.A.O.concatSomes;

        let inputs = dists |> E.A.fmap(r => (r, 1.0));
        Ok(`PointwiseCombination(inputs));
      }
    | Fn({name}) => Error(name ++ ": name not found")
  );