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
           ~guesstimatorString="floor(10 to 14)",
           ~domain=Complete,
           (),
         ),
       )
       |> E.O.React.fmapOrNull(distPlus => <DistPlusPlot distPlus />)}
    </div>
  </div>;
//  |> E.O.React.fmapOrNull(distPlus => <DistPlusPlot distPlus />)}
//  )
//    ),
//      (),
//      ~domain=Complete,
//      ~guesstimatorString="(5 to 10)",
//    DistPlusIngredients.make(
// {setup(
// <h2> {"Continuous Only" |> ReasonReact.string} </h2>
//  |> E.O.React.fmapOrNull(distPlus => <DistPlusPlot distPlus />)}
//  )
//    ),
//      (),
//      ~domain=Complete,
//      ~guesstimatorString="floor(5 to 10)",
//    DistPlusIngredients.make(
// {setup(
// <h2> {"Discrete Only" |> ReasonReact.string} </h2>
//  |> E.O.React.fmapOrNull(distPlus => <DistPlusPlot distPlus />)}
//  )
//    ),
//      (),
//      ~domain=Complete,
//      ~guesstimatorString="mm(floor(10 to 15), 10 to 11, [.9,.1])",
//    DistPlusIngredients.make(
// {setup(
// <h2> {"Simple Mixed Distribution" |> ReasonReact.string} </h2>
//  |> E.O.React.fmapOrNull(distPlus => <DistPlusPlot distPlus />)}
//  )
//    ),
//      (),
//        }),
//          unit: `days,
//          zero: MomentRe.momentNow(),
//        DistTypes.TimeDistribution({
//      ~unit=
//      ~domain=Complete,
//      ~guesstimatorString="mm(floor(10 to 15), 10 to 11, [.9,.1])",
//    DistPlusIngredients.make(
// {setup(
// <h2> {"Complex Distribution Days" |> ReasonReact.string} </h2>
//  |> E.O.React.fmapOrNull(distPlus => <DistPlusPlot distPlus />)}
//  )
//    ),
//      (),
//        }),
//          unit: `years,
//          zero: MomentRe.momentNow(),
//        DistTypes.TimeDistribution({
//      ~unit=
//      ~domain=Complete,
//      ~guesstimatorString="mm(floor(10 to 15), 10 to 11, [.9,.1])",
//    DistPlusIngredients.make(
// {setup(
// <h2> {"Complex Distribution" |> ReasonReact.string} </h2>

let entry = EntryTypes.(entry(~title="Pdf", ~render=distributions));