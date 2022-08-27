module TypeChecker = Reducer_Type_TypeChecker
module T = Reducer_Dispatch_T
open ReducerInterface_InternalExpressionValue

type errorValue = Reducer_ErrorValue.errorValue

let makeFromTypes = jumpTable => {
  let dispatchChainPiece: T.dispatchChainPiece = ((fnName, fnArgs): functionCall, environment) => {
    let jumpTableEntry = jumpTable->Js.Array2.find(elem => {
      let (candidName, candidType, _) = elem
      candidName == fnName && TypeChecker.checkITypeArgumentsBool(candidType, fnArgs)
    })
    switch jumpTableEntry {
    | Some((_, _, bridgeFn)) => bridgeFn(fnArgs, environment)->Some
    | _ => None
    }
  }
  dispatchChainPiece
}
