open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "Builtin"

type simpleDefinition = {
  inputs: array<frType>,
  fn: (array<internalExpressionValue>) => result<internalExpressionValue, string>,
}

let makeFnMany = (name: string, definitions: array<simpleDefinition>) =>
  Function.make(
    ~name=name,
    ~nameSpace,
    ~requiresNamespace=false,
    ~definitions=definitions->Js.Array2.map(
      ({ inputs, fn }) => FnDefinition.make(
        ~name=name,
        ~inputs=inputs,
        ~run=(inputs, _, _, _) => fn(inputs),
        ()
      )
    ),
    (),
  )

let makeFn = (name: string, inputs: array<frType>, fn: (array<internalExpressionValue>) => result<internalExpressionValue, string>) =>
  makeFnMany(name, [{ inputs, fn }])

let library = [
// TODO - other MathJS
  Function.make(
    ~name="add",
    ~nameSpace,
    ~requiresNamespace=false,
    ~definitions=[
      FnDefinition.make(
        ~name="add",
        ~inputs=[FRTypeNumber, FRTypeNumber],
        ~run=(inputs, _, _, _) => {
          switch inputs {
          | [IEvNumber(x), IEvNumber(y)] => IEvNumber(x+.y)->Ok
          | _ => Error(impossibleError)
          }
        },
        ()
      ),
      FnDefinition.make(
        ~name="add",
        ~inputs=[FRTypeNumber, FRTypeNumber],
        ~run=(inputs, _, _, _) => {
          switch inputs {
          | [IEvNumber(x), IEvNumber(y)] => IEvNumber(x+.y)->Ok
          | _ => Error(impossibleError)
          }
        },
        ()
      ),
      FnDefinition.make(
        ~name="add",
        ~inputs=[FRTypeNumber, FRTypeNumber],
        ~run=(inputs, _, _, _) => {
          switch inputs {
          | [IEvNumber(x), IEvNumber(y)] => IEvNumber(x+.y)->Ok
          | _ => Error(impossibleError)
          }
        },
        ()
      ),
    ],
    (),
  ),
]
