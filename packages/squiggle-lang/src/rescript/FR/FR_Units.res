open FunctionRegistry_Core

let makeUnitFn = (name: string, multiplier: float) => {
  Function.make(
    ~name="fromUnit_" ++ name,
    ~nameSpace="",
    ~requiresNamespace=false,
    ~definitions=[
      FnDefinition.make(
        ~name="fromUnit_" ++ name,
        ~inputs=[FRTypeNumber],
        ~run=(inputs, _, _) => {
          switch inputs {
          | [IEvNumber(f)] => IEvNumber(f *. multiplier)->Ok
          | _ => FunctionRegistry_Helpers.impossibleError->Error
          }
        },
        (),
      ),
    ],
    (),
  )
}

let library = [
  makeUnitFn("n", 1E-9),
  makeUnitFn("m", 1E-3),
  makeUnitFn("k", 1E3),
  makeUnitFn("M", 1E6),
  makeUnitFn("B", 1E9),
  makeUnitFn("G", 1E9),
  makeUnitFn("T", 1E12),
  makeUnitFn("P", 1E15),
]
