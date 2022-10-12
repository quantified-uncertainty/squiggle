open FunctionRegistry_Core
open FunctionRegistry_Helpers

let makeFn = (
  name: string,
  inputs: array<frType>,
  fn: array<Reducer_T.value> => result<Reducer_T.value, errorMessage>,
) =>
  Function.make(
    ~name,
    ~nameSpace="",
    ~requiresNamespace=false,
    ~definitions=[FnDefinition.make(~name, ~inputs, ~run=(inputs, _, _) => fn(inputs), ())],
    (),
  )

let makeNumberToDurationFn = (name: string, fn: float => DateTime.Duration.t) =>
  Function.make(
    ~name,
    ~nameSpace="",
    ~requiresNamespace=false,
    ~definitions=[
      FnDefinition.make(
        ~name,
        ~inputs=[FRTypeNumber],
        ~run=(inputs, _, _) =>
          switch inputs {
          | [IEvNumber(t)] => IEvTimeDuration(fn(t))->Ok
          | _ => Error(impossibleError)
          },
        (),
      ),
    ],
    (),
  )

let makeDurationToNumberFn = (name: string, fn: DateTime.Duration.t => float) =>
  Function.make(
    ~name,
    ~nameSpace="",
    ~requiresNamespace=false,
    ~definitions=[
      FnDefinition.make(
        ~name,
        ~inputs=[FRTypeTimeDuration],
        ~run=(inputs, _, _) =>
          switch inputs {
          | [IEvTimeDuration(t)] => IEvNumber(fn(t))->Ok
          | _ => Error(impossibleError)
          },
        (),
      ),
    ],
    (),
  )

let library = [
  makeFn("toString", [FRTypeDate], inputs =>
    switch inputs {
    | [IEvDate(t)] => IEvString(DateTime.Date.toString(t))->Ok
    | _ => Error(impossibleError)
    }
  ),
  makeFn("makeDateFromYear", [FRTypeNumber], inputs =>
    switch inputs {
    | [IEvNumber(year)] =>
      switch DateTime.Date.makeFromYear(year) {
      | Ok(t) => IEvDate(t)->Ok
      | Error(e) => SqError.Message.RETodo(e)->Error
      }
    | _ => Error(impossibleError)
    }
  ),
  makeFn("dateFromNumber", [FRTypeNumber], inputs =>
    switch inputs {
    | [IEvNumber(f)] => IEvDate(DateTime.Date.fromFloat(f))->Ok
    | _ => Error(impossibleError)
    }
  ),
  makeFn("toNumber", [FRTypeDate], inputs =>
    switch inputs {
    | [IEvDate(f)] => IEvNumber(DateTime.Date.toFloat(f))->Ok
    | _ => Error(impossibleError)
    }
  ),
  makeFn("subtract", [FRTypeDate, FRTypeDate], inputs =>
    switch inputs {
    | [IEvDate(d1), IEvDate(d2)] =>
      switch DateTime.Date.subtract(d1, d2) {
      | Ok(d) => IEvTimeDuration(d)->Ok
      | Error(e) => Error(RETodo(e))
      }
    | _ => Error(impossibleError)
    }
  ),
  makeFn("subtract", [FRTypeDate, FRTypeTimeDuration], inputs =>
    switch inputs {
    | [IEvDate(d1), IEvTimeDuration(d2)] => IEvDate(DateTime.Date.subtractDuration(d1, d2))->Ok
    | _ => Error(impossibleError)
    }
  ),
  makeFn("add", [FRTypeDate, FRTypeTimeDuration], inputs =>
    switch inputs {
    | [IEvDate(d1), IEvTimeDuration(d2)] => IEvDate(DateTime.Date.addDuration(d1, d2))->Ok
    | _ => Error(impossibleError)
    }
  ),
  makeFn("toString", [FRTypeTimeDuration], inputs =>
    switch inputs {
    | [IEvTimeDuration(t)] => IEvString(DateTime.Duration.toString(t))->Ok
    | _ => Error(impossibleError)
    }
  ),
  makeNumberToDurationFn("minutes", DateTime.Duration.fromMinutes),
  makeNumberToDurationFn("fromUnit_minutes", DateTime.Duration.fromMinutes),
  makeNumberToDurationFn("hours", DateTime.Duration.fromHours),
  makeNumberToDurationFn("fromUnit_hours", DateTime.Duration.fromHours),
  makeNumberToDurationFn("days", DateTime.Duration.fromDays),
  makeNumberToDurationFn("fromUnit_days", DateTime.Duration.fromDays),
  makeNumberToDurationFn("years", DateTime.Duration.fromYears),
  makeNumberToDurationFn("fromUnit_years", DateTime.Duration.fromYears),
  makeDurationToNumberFn("toMinutes", DateTime.Duration.toMinutes),
  makeDurationToNumberFn("toHours", DateTime.Duration.toHours),
  makeDurationToNumberFn("toDays", DateTime.Duration.toDays),
  makeDurationToNumberFn("toYears", DateTime.Duration.toYears),
  makeFn("add", [FRTypeTimeDuration, FRTypeTimeDuration], inputs =>
    switch inputs {
    | [IEvTimeDuration(d1), IEvTimeDuration(d2)] =>
      IEvTimeDuration(DateTime.Duration.add(d1, d2))->Ok
    | _ => Error(impossibleError)
    }
  ),
  makeFn("subtract", [FRTypeTimeDuration, FRTypeTimeDuration], inputs =>
    switch inputs {
    | [IEvTimeDuration(d1), IEvTimeDuration(d2)] =>
      IEvTimeDuration(DateTime.Duration.subtract(d1, d2))->Ok
    | _ => Error(impossibleError)
    }
  ),
  makeFn("multiply", [FRTypeTimeDuration, FRTypeNumber], inputs =>
    switch inputs {
    | [IEvTimeDuration(d1), IEvNumber(d2)] =>
      IEvTimeDuration(DateTime.Duration.multiply(d1, d2))->Ok
    | _ => Error(impossibleError)
    }
  ),
  makeFn("divide", [FRTypeTimeDuration, FRTypeNumber], inputs =>
    switch inputs {
    | [IEvTimeDuration(d1), IEvNumber(d2)] => IEvTimeDuration(DateTime.Duration.divide(d1, d2))->Ok
    | _ => Error(impossibleError)
    }
  ),
  makeFn("divide", [FRTypeTimeDuration, FRTypeTimeDuration], inputs =>
    switch inputs {
    | [IEvTimeDuration(d1), IEvTimeDuration(d2)] => IEvNumber(d1 /. d2)->Ok
    | _ => Error(impossibleError)
    }
  ),
]
