open FunctionRegistry_Core
open FunctionRegistry_Helpers

let nameSpace = "Plot"

module Internals = {
  let parseString = (a: Reducer_T.value): result<string, SqError.Message.t> => {
    switch a {
    | IEvString(s) => Ok(s)
    | _ => Error(SqError.Message.REOther("Expected to be a string"))
    }
  }

  let parseDistributionOrNumber = (a: Reducer_T.value): result<
    GenericDist.t,
    SqError.Message.t,
  > => {
    switch a {
    | IEvDistribution(s) => Ok(s)
    | IEvNumber(s) => Ok(GenericDist.fromFloat(s))
    | _ => Error(SqError.Message.REOther("Expected to be a distribution"))
    }
  }

  let parseArray = (
    parser: Reducer_T.value => result<'a, SqError.Message.t>,
    a: Reducer_T.value,
  ): result<array<'a>, SqError.Message.t> => {
    switch a {
    | IEvArray(x) => x->E.A2.fmap(parser)->E.A.R.firstErrorOrOpen
    | _ => Error(SqError.Message.REOther("Expected to be an array"))
    }
  }

  let parseRecord = (
    parser: Reducer_T.map => result<'b, SqError.Message.t>,
    a: Reducer_T.value,
  ): result<'b, SqError.Message.t> => {
    switch a {
    | IEvRecord(x) => parser(x)
    | _ => Error(SqError.Message.REOther("Expected to be an array"))
    }
  }

  let parseField = (
    a: Reducer_T.map,
    key: string,
    parser: Reducer_T.value => result<'a, SqError.Message.t>,
  ): result<'a, SqError.Message.t> => {
    switch Belt.Map.String.get(a, key) {
    | Some(x) => parser(x)
    | None => Error(SqError.Message.REOther("expected field " ++ key ++ " in plot dictionary."))
    }
  }

  let parseLabeledDistribution = (a: Reducer_T.map): result<
    Reducer_T.labeledDistribution,
    SqError.Message.t,
  > => {
    let name = parseField(a, "name", parseString)
    let distribution = parseField(a, "value", parseDistributionOrNumber)
    switch E.R.merge(name, distribution) {
    | Ok(name, distribution) => Ok({name: name, distribution: distribution})
    | Error(err) => Error(err)
    }
  }

  let parsePlotValue = (a: Reducer_T.map): result<Reducer_T.plotValue, SqError.Message.t> => {
    parseField(a, "show", parseArray(parseRecord(parseLabeledDistribution)))->E.R2.fmap(dists => {
      let plot: Reducer_T.plotValue = {distributions: dists}
      plot
    })
  }

  let dist = (a: Reducer_T.map): result<Reducer_T.value, SqError.Message.t> =>
    E.R2.fmap(parsePlotValue(a), x => Reducer_T.IEvPlot(x))
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
      FnDefinition.make(
        ~name="dist",
        ~inputs=[FRTypeDict(FRTypeAny)],
        ~run=(inputs, _, _) => {
          switch inputs {
          | [IEvRecord(plot)] => Internals.dist(plot)
          | _ => impossibleError->Error
          }
        },
        (),
      ),
    ],
    (),
  ),
]
