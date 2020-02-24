// "mm(floor(uniform(30,35)), normal(50,20), [.25,.5])",
// "mm(floor(normal(28,4)), normal(32,2), uniform(20,24), [.5,.2,.1])",
let timeVector: TimeTypes.timeVector = {
  zero: MomentRe.momentNow(),
  unit: `years,
};

let timeDist =
  DistPlusIngredients.make(
    ~guesstimatorString="mm(floor(10 to 15), 10 to 11, [.9,.1])",
    ~domain=Complete,
    ~unit=DistTypes.TimeDistribution(timeVector),
    (),
  )
  |> DistPlusIngredients.toDistPlus(~sampleCount=5000, ~outputXYPoints=1000);

let distributions = () =>
  <div>
    <div>
      <h2> {"Basic Mixed Distribution" |> ReasonReact.string} </h2>
      {timeDist
       |> E.O.fmap(
            Distributions.DistPlus.T.scaleToIntegralSum(~intendedSum=1.0),
          )
       |> E.O.React.fmapOrNull(distPlus => <DistPlusPlot distPlus />)}
      <h2> {"Simple Continuous" |> ReasonReact.string} </h2>
    </div>
  </div>;

let entry = EntryTypes.(entry(~title="Pdf", ~render=distributions));