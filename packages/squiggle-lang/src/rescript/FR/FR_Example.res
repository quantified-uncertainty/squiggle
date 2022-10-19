open FunctionRegistry_Core
// open FunctionRegistry_Helpers

let nameSpace = "Aggregate"
let requiresNamespace = true

module Topic = {
  module Helpers = {
    let id = (x: float) => x
  }
  module Lib = {
    let id = Function.make(
      ~name="id",
      ~nameSpace,
      ~output=EvtNumber,
      ~requiresNamespace=false,
      ~examples=[`Agrgegate.id(1)`],
      ~definitions=[
        FnDefinition.make(
          ~name="id",
          ~inputs=[FRTypeNumber],
          ~run=(inputs, _, _) =>
            switch inputs {
            | [IEvNumber(x)] => {
                let unwrappedResult = Helpers.id(x)
                let wrappedResult = FunctionRegistry_Helpers.Wrappers.evNumber(unwrappedResult)
                Ok(wrappedResult)
              }

            | _ => "Error in Agrgegate.id"->SqError.Message.REOther->Error
            },
          (),
        ),
      ],
      (),
    )
  }
}

let library = [
  // Combinatorics
  Topic.Lib.id,
]

// Then, to actually use,
// add the new functions to
// src/rescript/FunctionRegistry/FunctionRegistry_Library.res
