module CDFConfig = {
  let shape: DistributionTypes.xyShape = {
    xs: [|1., 4., 8.|],
    ys: [|8., 9., 2.|],
  };
};

module CDF = CDFunctor.Make(CDFConfig);
