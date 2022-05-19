open FunctionRegistry_Core
open FunctionRegistry_Helpers

let twoArgs = (fn, (a1, a2)) => fn(a1, a2)

let process = (~fn, r) =>
  r->E.R.bind(Process.twoDistsOrNumbersToDistUsingSymbolicDist(~fn, ~values=_))

module NormalFn = {
  let fnName = "normal"
  let mainInputType = I_DistOrNumber

  let toFn = Function.make(
    ~name="Normal",
    ~definitions=[
      Function.makeDefinition(~name=fnName, ~inputs=[mainInputType, mainInputType], ~run=inputs => {
        inputs->Prepare.twoDistOrNumber->process(~fn=twoArgs(SymbolicDist.Normal.make))
      }),
      Function.makeDefinition(
        ~name=fnName,
        ~inputs=[I_Record([("mean", mainInputType), ("stdev", mainInputType)])],
        ~run=inputs =>
          inputs->Prepare.twoDistOrNumberFromRecord->process(~fn=twoArgs(SymbolicDist.Normal.make)),
      ),
      Function.makeDefinition(
        ~name=fnName,
        ~inputs=[I_Record([("p5", mainInputType), ("p95", mainInputType)])],
        ~run=inputs =>
          inputs
          ->Prepare.twoDistOrNumberFromRecord
          ->process(~fn=r => twoArgs(SymbolicDist.Normal.from90PercentCI, r)->Ok),
      ),
    ],
  )
}

module LognormalFn = {
  let fnName = "lognormal"
  let mainInputType = I_DistOrNumber

  let toFn = Function.make(
    ~name="Lognormal",
    ~definitions=[
      Function.makeDefinition(~name=fnName, ~inputs=[mainInputType, mainInputType], ~run=inputs =>
        inputs->Prepare.twoDistOrNumber->process(~fn=twoArgs(SymbolicDist.Lognormal.make))
      ),
      Function.makeDefinition(
        ~name=fnName,
        ~inputs=[I_Record([("p5", mainInputType), ("p95", mainInputType)])],
        ~run=inputs =>
          inputs
          ->Prepare.twoDistOrNumberFromRecord
          ->process(~fn=r => twoArgs(SymbolicDist.Lognormal.from90PercentCI, r)->Ok),
      ),
      Function.makeDefinition(
        ~name=fnName,
        ~inputs=[I_Record([("mean", mainInputType), ("stdev", mainInputType)])],
        ~run=inputs =>
          inputs
          ->Prepare.twoDistOrNumberFromRecord
          ->process(~fn=twoArgs(SymbolicDist.Lognormal.fromMeanAndStdev)),
      ),
    ],
  )
}

let allFunctions = [NormalFn.toFn, LognormalFn.toFn]
