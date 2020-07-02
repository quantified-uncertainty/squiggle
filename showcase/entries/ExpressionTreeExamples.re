let setup = dist =>
  RenderTypes.DistPlusRenderer.make(~distPlusIngredients=dist, ())
  |> DistPlusRenderer.run
  |> RenderTypes.DistPlusRenderer.Outputs.distplus
  |> R.O.fmapOrNull(distPlus => <DistPlusPlot distPlus />);

let simpleExample = (guesstimatorString, ~problem="", ()) =>
  <>
    <p> {guesstimatorString |> ReasonReact.string} </p>
    <p> {problem |> (e => "problem: " ++ e) |> ReasonReact.string} </p>
    {setup(
       RenderTypes.DistPlusRenderer.Ingredients.make(~guesstimatorString, ()),
     )}
  </>;

let distributions = () =>
  <div>
    <div>
      <h2 className="text-gray-800 text-xl font-bold">
        {"Initial Section" |> ReasonReact.string}
      </h2>
      {simpleExample(
         "normal(-1, 1) + normal(5, 2)",
         ~problem="Tails look too flat",
         (),
       )}
      {simpleExample(
         "mm(normal(4,2), normal(10,1))",
         ~problem="Tails look too flat",
         (),
       )}
      {simpleExample(
         "normal(-1, 1) * normal(5, 2)",
         ~problem="This looks really weird",
         (),
       )}
      {simpleExample(
         "normal(1,2) * normal(2,2) * normal(3,1)",
         ~problem="Seems like important parts are cut off",
         (),
       )}
      {simpleExample(
         "mm(uniform(0, 1) , normal(3,2))",
         ~problem="Uniform distribution seems to break multimodal",
         (),
       )}
      {simpleExample(
        "truncate(mm(1 to 10, 10 to 30), 10, 20)",
         ~problem="Truncate seems to have no effect",
         (),
       )}
      {simpleExample(
        "normal(5,2)*(10^3)",
         ~problem="Multiplied items should be evaluated.",
         (),
       )}
      {simpleExample(
        "normal(5,10*3)",
         ~problem="At least simple operations in the distributions should be evaluated.",
         (),
       )}
      {simpleExample(
        "normal(5,10)^3",
         ~problem="Exponentiation not yet supported",
         (),
       )}
    </div>
  </div>;

let entry =
  EntryTypes.(entry(~title="ExpressionTree", ~render=distributions));
