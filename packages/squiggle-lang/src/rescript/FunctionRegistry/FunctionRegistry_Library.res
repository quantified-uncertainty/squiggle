open FunctionRegistry_Core
open FunctionRegistry_Helpers

let twoArgs = (fn, (a1, a2)) => fn(a1, a2)

module NormalFn = {
  let fnName = "normal"

  let toFn = Function.make(
    ~name="Normal",
    ~definitions=[
      TwoArgDist.mkRegular(fnName, twoArgs(SymbolicDist.Normal.make)),
      TwoArgDist.mkDef90th(fnName, r => twoArgs(SymbolicDist.Normal.from90PercentCI, r)->Ok),
      TwoArgDist.mkDefMeanStdev(fnName, twoArgs(SymbolicDist.Normal.make)),
    ],
  )
}

module LognormalFn = {
  let fnName = "lognormal"

  let toFn = Function.make(
    ~name="Lognormal",
    ~definitions=[
      TwoArgDist.mkRegular(fnName, twoArgs(SymbolicDist.Lognormal.make)),
      TwoArgDist.mkDef90th(fnName, r => twoArgs(SymbolicDist.Lognormal.from90PercentCI, r)->Ok),
      TwoArgDist.mkDefMeanStdev(fnName, twoArgs(SymbolicDist.Lognormal.fromMeanAndStdev)),
    ],
  )
}

let more = [
  Function.make(
    ~name="Uniform",
    ~definitions=[TwoArgDist.mkRegular("uniform", twoArgs(SymbolicDist.Uniform.make))],
  ),
  Function.make(
    ~name="Beta",
    ~definitions=[TwoArgDist.mkRegular("beta", twoArgs(SymbolicDist.Beta.make))],
  ),
  Function.make(
    ~name="Cauchy",
    ~definitions=[TwoArgDist.mkRegular("cauchy", twoArgs(SymbolicDist.Cauchy.make))],
  ),
  Function.make(
    ~name="Gamma",
    ~definitions=[TwoArgDist.mkRegular("gamma", twoArgs(SymbolicDist.Gamma.make))],
  ),
  Function.make(
    ~name="Logistic",
    ~definitions=[TwoArgDist.mkRegular("logistic", twoArgs(SymbolicDist.Logistic.make))],
  ),
  Function.make(
    ~name="To",
    ~definitions=[TwoArgDist.mkRegular("to", twoArgs(SymbolicDist.From90thPercentile.make))],
  ),
]

let allFunctions = [NormalFn.toFn, LognormalFn.toFn]
