let normal = (mean: float, std: float) =>
  Js.Float.(
    {
      let nMean = toPrecisionWithPrecision(mean, ~digits=4);
      let nStd = toPrecisionWithPrecision(std, ~digits=2);
      {j|normal($(nMean), $(nStd))|j};
    }
  );

let divide = (str1: string, str2: string) => {j|$(str1)/$(str2)|j};