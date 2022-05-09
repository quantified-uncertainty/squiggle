module KLDivergence = {
  let logFn = Js.Math.log // base e
  let integrand = (predictionElement: float, answerElement: float): result<
    float,
    Operation.Error.t,
  > =>
    // We decided that negative infinity, not an error at answerElement = 0.0, is a desirable value.
    if answerElement == 0.0 {
      Ok(0.0)
    } else {
      let quot = predictionElement /. answerElement
      quot < 0.0 ? Error(Operation.ComplexNumberError) : Ok(-.answerElement *. logFn(quot))
    }
}
