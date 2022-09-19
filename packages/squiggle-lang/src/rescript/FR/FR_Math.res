open FunctionRegistry_Helpers

let library = [
  // ported MathJS functions
  // https://docs.google.com/spreadsheets/d/1bUK2RaBFg8aJHuzZcw9yXp8StCBH5If5sU2iRw1T_HY/edit
  // TODO - implement the rest of useful stuff

  Make.f2f(
    ~name="sqrt",
    ~nameSpace="Math",
    ~requiresNamespace=true,
    ~fn=x => Js.Math.pow_float(~base=x, ~exp=0.5),
    (),
  ),
  Make.f2f(~name="sin", ~nameSpace="Math", ~requiresNamespace=true, ~fn=Js.Math.sin, ()),
  Make.f2f(~name="cos", ~nameSpace="Math", ~requiresNamespace=true, ~fn=Js.Math.cos, ()),
  Make.f2f(~name="tan", ~nameSpace="Math", ~requiresNamespace=true, ~fn=Js.Math.tan, ()),
  Make.f2f(~name="asin", ~nameSpace="Math", ~requiresNamespace=true, ~fn=Js.Math.asin, ()),
  Make.f2f(~name="acos", ~nameSpace="Math", ~requiresNamespace=true, ~fn=Js.Math.acos, ()),
  Make.f2f(~name="atan", ~nameSpace="Math", ~requiresNamespace=true, ~fn=Js.Math.atan, ()),
]
