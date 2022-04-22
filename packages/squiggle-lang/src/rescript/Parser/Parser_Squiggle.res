open Parser_Combinators
let {dispatch} = module(ReducerInterface_GenericDistribution)
type expressionValue = ReducerInterface_ExpressionValue.expressionValue

module Grammar = {
  type expressionValueOR = option<
    result<ReducerInterface_ExpressionValue.expressionValue, Reducer_ErrorValue.errorValue>,
  >
  let normalDist: t<expressionValueOR> = bind(Symbols.normalNode, _ =>
    bind(Symbols.openParen, _ =>
      bind(Primitive.natural, mean =>
        bind(Symbols.comma, _ =>
          bind(Primitive.natural, stdev =>
            bind(Symbols.closeParen, _ =>
              returnP(
                dispatch((
                  "normal",
                  [mean->Belt.Float.fromInt->EvNumber, stdev->Belt.Float.fromInt->EvNumber],
                )),
              )
            )
          )
        )
      )
    )
  )
  let number: t<expressionValueOR> = bind(Primitive.natural, x =>
    returnP(dispatch(("float", [x->Belt.Float.fromInt->EvNumber])))
  )
  let evNormalDistribution: t<expressionValueOR> = Primitive.token(normalDist)
  let evNatural: t<expressionValueOR> = Primitive.token(number)

  let retGenericDistOrRaise: expressionValueOR => GenericDist_Types.genericDist = etf => {
    switch etf {
    | Some(Ok(EvDistribution(dist))) => dist
    | Some(_) => raise(Wrongo("something bad happened"))
    | None => raise(Wrongo("something bad happened"))
    }
  }

  let rec expr: lazy_t<t<expressionValueOR>> = lazy bind(Lazy.force(term), t =>
    choice(
      bind(Primitive.symbol("+"), _ =>
        bind(Lazy.force(expr), e => {
          let t' = retGenericDistOrRaise(t)
          let e' = retGenericDistOrRaise(e)
          returnP(dispatch(("add", [EvDistribution(t'), EvDistribution(e')])))
        })
      ),
      choice(
        bind(Primitive.symbol("-"), _ =>
          bind(Lazy.force(expr), e => {
            let t' = retGenericDistOrRaise(t)
            let e' = retGenericDistOrRaise(e)
            returnP(dispatch(("subtract", [EvDistribution(t'), EvDistribution(e')])))
          })
        ),
        returnP(t),
      ),
    )
  )
  and term: lazy_t<t<expressionValueOR>> = lazy bind(Lazy.force(factor), f =>
    choice(
      bind(
        Primitive.symbol("*"),
        _ =>
          bind(Lazy.force(term), t => {
            let f' = retGenericDistOrRaise(f)
            let t' = retGenericDistOrRaise(t)
            returnP(dispatch(("multiply", [EvDistribution(f'), EvDistribution(t')])))
          })),
        returnP(f),
      ),
    )
  and factor: lazy_t<t<expressionValueOR>> = lazy choice(
    bind(Symbols.openParen, _ =>
      bind(Lazy.force(expr), e => bind(Symbols.closeParen, _ => returnP(e)))
    ),
    evNormalDistribution,
  )
}

let eval: string => Grammar.expressionValueOR = xs =>
  switch parse(Lazy.force(Grammar.expr), xs) {
  | list{(n, "")} => n
  | list{(_, out)} => raise(Wrongo(`unconsumed input ${out}`))
  | list{} => raise(Wrongo("invalid input"))
  | _ => raise(Wrongo(wrongoMessage))
  }
let foo = eval(" normal(5, 2) + normal(0, 2) * normal ( 10, 1 ) - normal (5 , \n 1)")
