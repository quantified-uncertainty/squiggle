let data: DistributionTypes.xyShape = {
  xs: [|1., 10., 10., 200., 250., 292., 330.|],
  ys: [|0.0, 0.0, 0.1, 0.3, 0.5, 0.2, 0.1|],
};

let mixedDist =
  GenericDistribution.make(
    ~generationSource=
      GuesstimatorString(
        "mm(floor(uniform(20, 30)), normal(50,10), [.5,.5])",
      ),
    ~probabilityType=Pdf,
    ~domain=Complete,
    ~unit=UnspecifiedDistribution,
    (),
  )
  |> GenericDistribution.renderIfNeeded(~sampleCount=1000);

let timeDist =
  GenericDistribution.make(
    ~generationSource=GuesstimatorString("mm(3, normal(5,1), [.5,.5])"),
    ~probabilityType=Pdf,
    ~domain=Complete,
    ~unit=
      TimeDistribution({
        zero: MomentRe.momentNow(),
        step: `years,
        length:
          MomentRe.Moment.add(
            ~duration=MomentRe.duration(5., `years),
            MomentRe.momentNow(),
          ),
      }),
    (),
  )
  |> GenericDistribution.renderIfNeeded(~sampleCount=1000);

let domainLimitedDist =
  GenericDistribution.make(
    ~generationSource=GuesstimatorString("mm(3, normal(5,1), [.5,.5])"),
    ~probabilityType=Pdf,
    ~domain=RightLimited({xPoint: 6.0, excludingProbabilityMass: 0.3}),
    ~unit=UnspecifiedDistribution,
    (),
  )
  |> GenericDistribution.renderIfNeeded(~sampleCount=1000);

let distributions = () =>
  <div>
    <div>
      <h2> {"Basic Mixed Distribution" |> ReasonReact.string} </h2>
      <GenericDistributionChart dist=mixedDist />
    </div>
  </div>;
// <div>
//   <h2> {"Time Distribution" |> ReasonReact.string} </h2>
//   <GenericDistributionChart dist=timeDist />
// </div>
// <div>
//   <h2> {"Domain Limited Distribution" |> ReasonReact.string} </h2>
//   <GenericDistributionChart dist=domainLimitedDist />
// </div>

let entry = EntryTypes.(entry(~title="Pdf", ~render=distributions));