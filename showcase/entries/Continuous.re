// "mm(floor(uniform(30,35)), normal(50,20), [.25,.5])",
let timeDist =
  GenericDistribution.make(
    ~generationSource=
      GuesstimatorString("mm(floor(normal(30,2)), normal(39,1), [.5,.5])"),
    ~probabilityType=Pdf,
    ~domain=Complete,
    ~unit=TimeDistribution({zero: MomentRe.momentNow(), unit: `days}),
    (),
  )
  |> GenericDistribution.toComplexPower(~sampleCount=1000);

let distributions = () =>
  <div>
    <div>
      <h2> {"Basic Mixed Distribution" |> ReasonReact.string} </h2>
      {timeDist
       |> E.O.React.fmapOrNull(complexPower =>
            <ComplexPowerChart complexPower />
          )}
      <h2> {"Simple Continuous" |> ReasonReact.string} </h2>
    </div>
  </div>;

let entry = EntryTypes.(entry(~title="Pdf", ~render=distributions));