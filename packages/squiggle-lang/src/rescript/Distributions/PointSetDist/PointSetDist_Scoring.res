module KLDivergence = {
  let logFn = Js.Math.log // base e
  let integrand = (predictionElement: float, answerElement: float): result<
    float,
    Operation.Error.t,
  > =>
    // We decided that negative infinity, not an error at answerElement = 0.0, is a desirable value.
    if answerElement == 0.0 {
      Ok(0.0)
    } else if predictionElement == 0.0 {
      Ok(infinity)
    } else {
      let quot = predictionElement /. answerElement
      quot < 0.0 ? Error(Operation.ComplexNumberError) : Ok(-.answerElement *. logFn(quot))
    }
}

module LogScoreWithPointResolution = {
  let logFn = Js.Math.log
  let score = (
    ~priorPdf: option<float => float>,
    ~predictionPdf: float => float,
    ~answer: float,
  ): result<float, Operation.Error.t> => {
    let numerator = answer->predictionPdf
    if numerator < 0.0 {
      Operation.ComplexNumberError->Error
    } else if numerator == 0.0 {
      infinity->Ok
    } else {
      -.(
        switch priorPdf {
        | None => numerator->logFn
        | Some(f) => {
            let priorDensityOfAnswer = f(answer)
            if priorDensityOfAnswer == 0.0 {
              neg_infinity
            } else {
              (numerator /. priorDensityOfAnswer)->logFn
            }
          }
        }
      )->Ok
    }
  }
}
