module Mixture = {
  let raiseArgumentError = (message: string) =>
    message->ArgumentError->REDistributionError->SqError.Message.throw

  let parseNumber = (args: Reducer_T.value): float =>
    switch args {
    | IEvNumber(x) => x
    | _ => raiseArgumentError("Not a number")
    }

  let parseNumberArray = (ags: array<Reducer_T.value>): array<float> => E.A.fmap(ags, parseNumber)

  let parseDist = (args: Reducer_T.value): DistributionTypes.genericDist =>
    switch args {
    | IEvDistribution(x) => x
    | IEvNumber(x) => GenericDist.fromFloat(x)
    | _ => raiseArgumentError("Not a distribution")
    }

  let parseDistributionArray = (ags: array<Reducer_T.value>): array<
    DistributionTypes.genericDist,
  > => E.A.fmap(ags, parseDist)

  let mixtureWithGivenWeights = (
    distributions: array<DistributionTypes.genericDist>,
    weights: array<float>,
    ~env: GenericDist.env,
  ): result<DistributionTypes.genericDist, DistributionTypes.error> =>
    E.A.length(distributions) == E.A.length(weights)
      ? GenericDist.mixture(E.A.zip(distributions, weights), ~env)
      : Error(
          ArgumentError("Error, mixture call has different number of distributions and weights"),
        )

  let mixtureWithDefaultWeights = (
    distributions: array<DistributionTypes.genericDist>,
    ~env: GenericDist.env,
  ) => {
    let length = E.A.length(distributions)
    let weights = Belt.Array.make(length, 1.0 /. Belt.Int.toFloat(length))
    mixtureWithGivenWeights(distributions, weights, ~env)
  }

  let mixture = (args: array<Reducer_T.value>, ~env: GenericDist.env) => {
    switch args {
    | [IEvArray(distributions)] =>
      parseDistributionArray(distributions)->mixtureWithDefaultWeights(~env)
    | [IEvArray(distributions), IEvArray(weights)] => {
        let distrs = parseDistributionArray(distributions)
        let wghts = parseNumberArray(weights)
        mixtureWithGivenWeights(distrs, wghts, ~env)
      }

    | _ =>
      switch E.A.last(args) {
      | Some(IEvArray(b)) => {
          let weights = parseNumberArray(b)
          let distributions = parseDistributionArray(
            E.A.slice(args, ~offset=0, ~len=E.A.length(args) - 1),
          )
          mixtureWithGivenWeights(distributions, weights, ~env)
        }

      | Some(IEvNumber(_))
      | Some(IEvDistribution(_)) =>
        parseDistributionArray(args)->mixtureWithDefaultWeights(~env)
      | _ => raiseArgumentError("Last argument of mx must be array or distribution")
      }
    }
  }
}

// FIXME - impossible to implement with FR due to arbitrary parameters length
let mxLambda = Reducer_Lambda.makeFFILambda("mx", (inputs, context, _) => {
  switch Mixture.mixture(inputs, ~env=context.environment) {
  | Ok(value) => IEvDistribution(value)
  | Error(e) => e->REDistributionError->SqError.Message.throw
  }
})
