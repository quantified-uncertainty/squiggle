// "mm(floor(uniform(30,35)), normal(50,20), [.25,.5])",
// "mm(floor(normal(28,4)), normal(32,2), uniform(20,24), [.5,.2,.1])",

let timeDist =
  DistPlusIngredients.make(
    ~guesstimatorString="(floor(10 to 15))",
    ~domain=Complete,
    ~unit=
      DistTypes.TimeDistribution({zero: MomentRe.momentNow(), unit: `years}),
    (),
  );

let setup = dist =>
  dist
  |> DistPlusIngredients.toDistPlus(
       ~sampleCount=10000,
       ~outputXYPoints=2000,
       ~truncateTo=Some(1000),
     );

let distributions = () =>
  <div>
    <div>
      <h2> {"Single-Discrete" |> ReasonReact.string} </h2>
      {setup(
         DistPlusIngredients.make(
           ~guesstimatorString="mm(5 to 20, floor(normal(20,2)), [.5, .5])",
           ~domain=Complete,
           (),
         ),
       )
       |> E.O.React.fmapOrNull(distPlus => <DistPlusPlot distPlus />)}
    </div>
  </div>;

let entry = EntryTypes.(entry(~title="Pdf", ~render=distributions));