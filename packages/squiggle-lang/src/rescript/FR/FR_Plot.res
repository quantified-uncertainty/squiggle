open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "Plot"

module FnApp = {
  type fnApp<'a> = {
    result: Reducer_T.value => result<'a, SqError.Message.t>,
    typeRequired: frType,
  }

  let fmap = (f: 'a => 'b, m: fnApp<'a>): fnApp<'b> => {
    {
      result: (a: Reducer_T.value) => E.R.fmap(f, m.result(a)),
      typeRequired: m.typeRequired,
    }
  }

  module Record = {
    type t<'a> = {
      result: Reducer_T.map => result<'a, SqError.Message.t>,
      typesRequired: array<(string, frType)>,
    }

    let getField = (key: string, parser: fnApp<'a>): t<'a> => {
      let func = (a: Reducer_T.map) =>
        switch Belt.Map.String.get(a, key) {
        | Some(x) => parser.result(x)
        | None => Error(impossibleError)
        }
      {result: func, typesRequired: [(key, parser.typeRequired)]}
    }

    let merge = (m1: t<'a>, m2: t<'b>): t<('a, 'b)> => {
      {
        result: (a: Reducer_T.map) => E.R.merge(m1.result(a), m2.result(a)),
        typesRequired: Belt.Array.concat(m1.typesRequired, m2.typesRequired),
      }
    }

    let fmap = (f: 'a => 'b, m: t<'a>): t<'b> => {
      {
        result: (a: Reducer_T.map) => E.R.fmap(f, m.result(a)),
        typesRequired: m.typesRequired,
      }
    }

    let app = (m1: t<'a => 'b>, m2: t<'a>): t<'b> => {
      {
        result: (a: Reducer_T.map) =>
          E.R.merge(m1.result(a), m2.result(a))->E.R2.fmap(((f, x)) => f(x)),
        typesRequired: Belt.Array.concat(m1.typesRequired, m2.typesRequired),
      }
    }
  }

  let getString: fnApp<string> = {
    let func = (a: Reducer_T.value) =>
      switch a {
      | IEvString(s) => Ok(s)
      | _ => Error(impossibleError)
      }
    {result: func, typeRequired: FRTypeString}
  }

  let getArray = (child: fnApp<'a>): fnApp<array<'a>> => {
    let func = (a: Reducer_T.value) =>
      switch a {
      | IEvArray(x) => x->E.A2.fmap(child.result)->E.A.R.firstErrorOrOpen
      | _ => Error(impossibleError)
      }
    {result: func, typeRequired: FRTypeArray(child.typeRequired)}
  }
  let getRecord = (recMonad: Record.t<'a>): fnApp<'a> => {
    let func = (a: Reducer_T.value) =>
      switch a {
      | IEvRecord(s) => recMonad.result(s)
      | _ => Error(impossibleError)
      }
    {result: func, typeRequired: FRTypeRecord(recMonad.typesRequired)}
  }

  let getDistOrNumber: fnApp<GenericDist.t> = {
    let func = (a: Reducer_T.value) =>
      switch a {
      | IEvDistribution(s) => Ok(s)
      | IEvNumber(s) => Ok(GenericDist.fromFloat(s))
      | _ => Error(impossibleError)
      }
    {result: func, typeRequired: FRTypeDistOrNumber}
  }

  let oneArgDef = (
    name: string,
    arg1: fnApp<'a>,
    def: 'a => result<Reducer_T.value, SqError.Message.t>,
  ): FnDefinition.t =>
    FnDefinition.make(
      ~name,
      ~inputs=[arg1.typeRequired],
      ~run=(inputs, _, _) => {
        E.R.bind(arg1.result(inputs[0]), def)
      },
      (),
    )
}

module Internals = {
  let makeLabeledDistribution = (
    name: string,
    distribution: GenericDist.t,
  ): Reducer_T.labeledDistribution => {name: name, distribution: distribution}

  let getLabeledDistribution: FnApp.fnApp<Reducer_T.labeledDistribution> = {
    makeLabeledDistribution
    ->FnApp.Record.fmap(FnApp.Record.getField("name", FnApp.getString))
    ->FnApp.Record.app(FnApp.Record.getField("value", FnApp.getDistOrNumber))
    ->FnApp.getRecord
  }

  let makePlot = (show: array<Reducer_T.labeledDistribution>): Reducer_T.plotValue => {
    distributions: show,
  }

  let parsePlotValue: FnApp.fnApp<Reducer_T.plotValue> = {
    makePlot
    ->FnApp.Record.fmap(FnApp.Record.getField("show", FnApp.getArray(getLabeledDistribution)))
    ->FnApp.getRecord
  }
}

let library = [
  Function.make(
    ~name="dist",
    ~nameSpace,
    ~requiresNamespace=true,
    ~output=EvtPlot,
    ~examples=[
      `Plot.dist({show: [{name: "Control", value: 1 to 2}, {name: "Treatment", value: 1.5 to 2.5}]}) `,
    ],
    ~definitions=[
      FnApp.oneArgDef("dist", Internals.parsePlotValue, (a: Reducer_T.plotValue) => Ok(IEvPlot(a))),
    ],
    (),
  ),
]
