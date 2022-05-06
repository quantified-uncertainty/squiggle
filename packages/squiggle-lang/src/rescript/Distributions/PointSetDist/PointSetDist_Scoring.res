module KLDivergence = {
  let logFn = Js.Math.log // base e
  let integrand = (predictionElement: float, answerElement: float): result<
    float,
    Operation.Error.t,
  > =>
    if answerElement == 0.0 {
      Ok(0.0)
    } else if predictionElement == 0.0 {
      Error(Operation.NegativeInfinityError)
    } else {
      let quot = predictionElement /. answerElement
      quot < 0.0 ? Error(Operation.ComplexNumberError) : Ok(answerElement *. logFn(quot))
    }
}
