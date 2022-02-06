type t = ExpressionTypes.Program.program;

let last = (r:t) => E.A.last(r) |> E.O.toResult("No rendered lines");
// let run = (p:program) => p |> E.A.last |> E.O.fmap(r => 
// )