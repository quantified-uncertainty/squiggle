type t = {
  distribution: Types.distribution,
  domainMaxX: float,
};

let fromCdf = (cdf: Types.cdf, domainMaxX: float, probabilityAtMaxX: float) => {
  let distribution: Types.distribution = {
    xs: cdf.xs,
    ys: cdf.ys |> E.A.fmap(r => r *. probabilityAtMaxX),
  };
  {distribution, domainMaxX};
};

let _lastElement = (a: array('a)) =>
  switch (Belt.Array.size(a)) {
  | 0 => None
  | n => Belt.Array.get(a, n)
  };

let probabilityBeforeDomainMax = (t: t) => _lastElement(t.distribution.ys);

let domainMaxX = (t: t) => t.domainMaxX;

let probabilityDistribution = (t: t) =>
  t.distribution |> CdfLibrary.Distribution.toPdf;

let probability = (t: t, xPoint: float) =>
  CdfLibrary.Distribution.findY(xPoint, probabilityDistribution(t));

let probabilityInverse = (t: t, yPoint: float) =>
  CdfLibrary.Distribution.findX(yPoint, probabilityDistribution(t));

let cumulativeProbability = (t: t, xPoint: float) =>
  CdfLibrary.Distribution.findY(xPoint, t.distribution);

let cumulativeProbabilityInverse = (t: t, yPoint: float) =>
  CdfLibrary.Distribution.findX(yPoint, t.distribution);