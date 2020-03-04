// Examples:
// mm(floor(uniform(30,35)), normal(50,20), [.25,.5])
// mm(floor(normal(28,4)), normal(32,2), uniform(20,24), [.5,.2,.1])
// mm(5 to 20, floor(normal(20,2)), [.5, .5])"
// floor(3 to 4)
// uniform(0,1) > 0.3 ? lognormal(6.652, -0.41): 0

let timeDist =
  DistPlusIngredients.make(
    ~guesstimatorString="(floor(10 to 15))",
    ~domain=RightLimited({xPoint: 50.0, excludingProbabilityMass: 0.3}),
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
     )
  |> E.O.React.fmapOrNull(distPlus => <DistPlusPlot distPlus />);

let distributions = () =>
  <div>
    <div>
      <h2 className="text-gray-800 text-xl font-bold">
        {"Initial Section" |> ReasonReact.string}
      </h2>
      <h3 className="text-gray-600 text-lg font-bold">
        {"Continuous" |> ReasonReact.string}
      </h3>
      {setup(DistPlusIngredients.make(~guesstimatorString="5 to 20", ()))}
      <h3 className="text-gray-600 text-lg font-bold">
        {"Discrete" |> ReasonReact.string}
      </h3>
      {setup(
         DistPlusIngredients.make(~guesstimatorString="floor(10 to 20)", ()),
       )}
      <h3 className="text-gray-600 text-lg font-bold">
        {"Mixed" |> ReasonReact.string}
      </h3>
      {setup(
         DistPlusIngredients.make(
           ~guesstimatorString="mm(5 to 20, floor(20 to 30), [.5,.5])",
           (),
         ),
       )}
      <h2 className="text-gray-800 text-xl font-bold">
        {"Over Time" |> ReasonReact.string}
      </h2>
      <h3 className="text-gray-600 text-lg font-bold">
        {"Continuous" |> ReasonReact.string}
      </h3>
      {setup(
         DistPlusIngredients.make(
           ~guesstimatorString="5 to 20",
           ~unit=TimeDistribution({zero: MomentRe.momentNow(), unit: `years}),
           (),
         ),
       )}
      <h3 className="text-gray-600 text-lg font-bold">
        {"Discrete" |> ReasonReact.string}
      </h3>
      {setup(
         DistPlusIngredients.make(
           ~guesstimatorString="floor(10 to 20)",
           ~unit=TimeDistribution({zero: MomentRe.momentNow(), unit: `years}),
           (),
         ),
       )}
      <h3 className="text-gray-600 text-lg font-bold">
        {"Mixed" |> ReasonReact.string}
      </h3>
      {setup(
         DistPlusIngredients.make(
           ~guesstimatorString="mm(5 to 20, floor(20 to 30), [.5,.5])",
           ~unit=TimeDistribution({zero: MomentRe.momentNow(), unit: `years}),
           (),
         ),
       )}
    </div>
  </div>;

let entry = EntryTypes.(entry(~title="Pdf", ~render=distributions));