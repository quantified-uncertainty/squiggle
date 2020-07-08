// Examples:
// mm(floor(uniform(30,35)), normal(50,20), [.25,.5])
// mm(floor(normal(28,4)), normal(32,2), uniform(20,24), [.5,.2,.1])
// mm(5 to 20, floor(normal(20,2)), [.5, .5])"
// floor(3 to 4)
// uniform(0,1) > 0.3 ? lognormal(6.652, -0.41): 0

let timeDist ={
  let ingredients = RenderTypes.DistPlusRenderer.Ingredients.make(
    ~guesstimatorString="(floor(10 to 15))",
    ~domain=RightLimited({xPoint: 50.0, excludingProbabilityMass: 0.3}),
    ~unit=
      DistTypes.TimeDistribution({zero: MomentRe.momentNow(), unit: `years}),
    ());
  let inputs = RenderTypes.DistPlusRenderer.make(~distPlusIngredients=ingredients,())
  inputs |> DistPlusRenderer.run
}

let setup = dist =>
  RenderTypes.DistPlusRenderer.make(~distPlusIngredients=dist,())
  |> DistPlusRenderer.run
  |> RenderTypes.DistPlusRenderer.Outputs.distplus
  |> R.O.fmapOrNull(distPlus => <DistPlusPlot distPlus />);

let simpleExample = (name, guesstimatorString) =>
  <>
    <h3 className="text-gray-600 text-lg font-bold">
      {name |> ReasonReact.string}
    </h3>
    {setup(RenderTypes.DistPlusRenderer.Ingredients.make(~guesstimatorString, ()))}
  </>;

let timeExample = (name, guesstimatorString) =>
  <>
    <h3 className="text-gray-600 text-lg font-bold">
      {name |> ReasonReact.string}
    </h3>
    {setup(
       RenderTypes.DistPlusRenderer.Ingredients.make(
         ~guesstimatorString,
         ~unit=TimeDistribution({zero: MomentRe.momentNow(), unit: `years}),
         (),
       ),
     )}
  </>;

let distributions = () =>
  <div>
    <div>
      <h2 className="text-gray-800 text-xl font-bold">
        {"Initial Section" |> ReasonReact.string}
      </h2>
        {simpleExample("Continuous", "5 to 20")}
        {simpleExample("Continuous, wide range", "1 to 1000000")}
        {simpleExample("Continuous, tiny values", "0.000000001 to 0.00000001")}
        {simpleExample(
           "Continuous large values",
           "50000000000000 to 200000000000000000",
         )}
        {simpleExample("Discrete", "floor(10 to 20)")}
        {simpleExample(
           "Discrete and below 0, normal(10,30)",
           "floor(normal(10,30))",
         )}
        {simpleExample("Discrete, wide range", "floor(10 to 200000)")}
        {simpleExample("Mixed", "mm(5 to 20, floor(20 to 30), [.5,.5])")}
        {simpleExample("Mixed, Early-Discrete Point", "mm(1, 5 to 20, [.5,.5])")}
        {simpleExample(
           "Mixed, Two-Discrete Points",
           "mm(0,10, 5 to 20, [.5,.5,.5])",
         )}
        <h2 className="text-gray-800 text-xl font-bold">
          {"Over Time" |> ReasonReact.string}
        </h2>
        {timeExample("Continuous", "5 to 20")}
        {timeExample("Continuous Over Long Period", "500 to 200000")}
        {timeExample("Continuous Over Short Period", "0.0001 to 0.001")}
        {timeExample(
           "Continuous Over Very Long Period",
           "500 to 20000000000000",
         )}
        {timeExample("Discrete", "floor(5 to 20)")}
        {timeExample("Mixed", "mm(5 to 20, floor(5 to 20), [.5,.5])")}
    </div>
  </div>;

let entry = EntryTypes.(entry(~title="Mixed Distributions", ~render=distributions));