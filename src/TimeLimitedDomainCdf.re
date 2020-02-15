open TimeTypes;

type t = {
  timeVector,
  limitedDomainCdf: LimitedDomainCdf.t,
};

let make =
    (
      ~timeVector: timeVector,
      ~distribution: Types.ContinuousDistribution.t,
      ~probabilityAtMaxX: float,
      ~maxX: [ | `time(MomentRe.Moment.t) | `x(float)],
    )
    : t => {
  let domainMaxX =
    switch (maxX) {
    | `time(m) => TimePoint.fromMoment(timeVector, m)
    | `x(r) => r
    };
  let limitedDomainCdf =
    LimitedDomainCdf.fromCdf(distribution, domainMaxX, probabilityAtMaxX);
  {timeVector, limitedDomainCdf};
};

let probabilityBeforeDomainMax = (t: t) =>
  LimitedDomainCdf.probabilityBeforeDomainMax(t.limitedDomainCdf);

let domainMaxX = (t: t) =>
  LimitedDomainCdf.probabilityBeforeDomainMax(t.limitedDomainCdf) /*   |> (r => RelativeTimePoint.toTime(t.timeVector, XValue(r)))*/;

// let probability = (t: t, m: MomentRe.Moment.t) => {
//   RelativeTimePoint.toXValue(t.timeVector, Time(m))
//   |> LimitedDomainCdf.probability(t.limitedDomainCdf);
// };

// let probabilityInverse = (t: t, y: float) =>
//   LimitedDomainCdf.probabilityInverse(t.limitedDomainCdf, y)
//   |> (r => RelativeTimePoint.toTime(t.timeVector, XValue(r)));

// let cumulativeProbability = (t: t, m: MomentRe.Moment.t) =>
//   RelativeTimePoint.toXValue(t.timeVector, Time(m))
//   |> LimitedDomainCdf.cumulativeProbability(t.limitedDomainCdf);

// let cumulativeProbabilityInverse = (t: t, y: float) =>
//   LimitedDomainCdf.cumulativeProbabilityInverse(t.limitedDomainCdf, y)