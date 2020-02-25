// "mm(floor(uniform(30,35)), normal(50,20), [.25,.5])",
// "mm(floor(normal(28,4)), normal(32,2), uniform(20,24), [.5,.2,.1])",

let timeDist =
  DistPlusIngredients.make(
    ~guesstimatorString="mm(floor(10 to 15), 10 to 11, [.9,.1])",
    ~domain=Complete,
    ~unit=
      DistTypes.TimeDistribution({zero: MomentRe.momentNow(), unit: `years}),
    (),
  );

let setup = dist =>
  dist
  |> DistPlusIngredients.toDistPlus(~sampleCount=5000, ~outputXYPoints=1000);

let distributions = () =>
  <div>
    <div>
      <h2> {"Single-Discrete" |> ReasonReact.string} </h2>
      {setup(
         DistPlusIngredients.make(
           ~guesstimatorString="8 to 12, [.5,.5])",
           ~domain=Complete,
           (),
         ),
       )
       |> E.O.React.fmapOrNull(distPlus => <DistPlusPlot distPlus />)}
    </div>
  </div>;

let entry = EntryTypes.(entry(~title="Pdf", ~render=distributions));