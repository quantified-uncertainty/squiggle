type timeUnit = [
  | `days
  | `hours
  | `milliseconds
  | `minutes
  | `months
  | `quarters
  | `seconds
  | `weeks
  | `years
];

type timeVector = {
  zero: MomentRe.Moment.t,
  unit: timeUnit,
};

type timePoint = {
  timeVector,
  value: float,
};

module TimePoint = {
  let fromTimeVector = (timeVector, value): timePoint => {timeVector, value};

  let toMoment = (timePoint: timePoint) => {
    timePoint.timeVector.zero
    |> MomentRe.Moment.add(
         ~duration=
           MomentRe.duration(timePoint.value, timePoint.timeVector.unit),
       );
  };

  let fromMoment = (timeVector: timeVector, moment: MomentRe.Moment.t) =>
    MomentRe.diff(timeVector.zero, moment, timeVector.unit);
};

module RelativeTimePoint = {
  type timeInVector =
    | Time(MomentRe.Moment.t)
    | XValue(float);

  let toTime = (timeVector: timeVector, timeInVector: timeInVector) =>
    switch (timeInVector) {
    | Time(r) => r
    | XValue(r) =>
      timeVector.zero
      |> MomentRe.Moment.add(~duration=MomentRe.duration(r, timeVector.unit))
    };

  let _timeToX = (time, timeStart, timeUnit) =>
    MomentRe.diff(timeStart, time, timeUnit);

  let toXValue = (timeVector: timeVector, timeInVector: timeInVector) =>
    switch (timeInVector) {
    | Time(r) => _timeToX(r, timeVector.zero, timeVector.unit)
    | XValue(r) => r
    };
};

type t = {
  timeVector,
  limitedDomainCdf: LimitedDomainCdf.t,
};

let make =
    (
      ~timeVector: timeVector,
      ~distribution: Types.distribution,
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
  LimitedDomainCdf.probabilityBeforeDomainMax(t.limitedDomainCdf);

let probability = (t: t, m: MomentRe.Moment.t) => {
  RelativeTimePoint.toXValue(t.timeVector, Time(m))
  |> LimitedDomainCdf.probability(t.limitedDomainCdf);
};

let probabilityInverse = (t: t, y: float) =>
  LimitedDomainCdf.probabilityInverse(t.limitedDomainCdf, y)
  |> (r => RelativeTimePoint.toTime(t.timeVector, XValue(r)));

let cumulativeProbability = (t: t, m: MomentRe.Moment.t) =>
  RelativeTimePoint.toXValue(t.timeVector, Time(m))
  |> LimitedDomainCdf.cumulativeProbability(t.limitedDomainCdf);

let cumulativeProbabilityInverse = (t: t, y: float) =>
  LimitedDomainCdf.cumulativeProbabilityInverse(t.limitedDomainCdf, y)
  |> (r => RelativeTimePoint.toTime(t.timeVector, XValue(r)));