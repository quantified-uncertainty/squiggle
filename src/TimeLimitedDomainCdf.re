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

type t = {
  timeUnit,
  timeStart: MomentRe.Moment.t,
  limitedDomainCdf: LimitedDomainCdf.t,
};

module XSpecification = {
  type xSpecification =
    | Time(MomentRe.Moment.t)
    | DifferenceFromStart(float, timeUnit)
    | CdfXCoordinate(float);

  let toTime = (t: t, xSpecification: xSpecification) =>
    switch (xSpecification) {
    | Time(r) => r
    | DifferenceFromStart(r, unit) =>
      t.timeStart
      |> MomentRe.Moment.add(~duration=MomentRe.duration(r, unit))
    | CdfXCoordinate(r) =>
      t.timeStart
      |> MomentRe.Moment.add(~duration=MomentRe.duration(r, t.timeUnit))
    };

  let rec toCdfXCoordinate = (t: t, xSpecification: xSpecification) =>
    switch (xSpecification) {
    | Time(r) => MomentRe.diff(t.timeStart, r, t.timeUnit)
    | DifferenceFromStart(r, unit) =>
      let newTime = toTime(t, DifferenceFromStart(r, unit));
      toCdfXCoordinate(t, Time(newTime));
    | CdfXCoordinate(r) => r
    };

  let fromDifference = (~t: t, ~duration: float, ~unit=t.timeUnit, ()) =>
    Time(
      MomentRe.Moment.add(
        ~duration=MomentRe.duration(duration, unit),
        t.timeStart,
      ),
    );
};

let probabilityBeforeDomainMax = (t: t) =>
  LimitedDomainCdf.probabilityBeforeDomainMax(t.limitedDomainCdf);

let domainMaxX = (t: t) =>
  LimitedDomainCdf.probabilityBeforeDomainMax(t.limitedDomainCdf);

let probability = (t: t, x: XSpecification.xSpecification) =>
  LimitedDomainCdf.probability(
    t.limitedDomainCdf,
    XSpecification.toCdfXCoordinate(t, x),
  );

let probabilityInverse = (t: t, y: float) =>
  XSpecification.CdfXCoordinate(
    LimitedDomainCdf.probabilityInverse(t.limitedDomainCdf, y),
  );

let cumulativeProbabilityInverse = (t: t, y: float) =>
  XSpecification.CdfXCoordinate(
    LimitedDomainCdf.cumulativeProbabilityInverse(t.limitedDomainCdf, y),
  );