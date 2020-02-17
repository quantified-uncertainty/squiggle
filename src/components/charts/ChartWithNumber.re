[@react.component]
let make = (~data, ~color=?) => {
  let (x, setX) = React.useState(() => 0.);
  let chart =
    React.useMemo1(
      () => <CdfChart__Plain data ?color onHover={r => setX(_ => r)} />,
      [|data|],
    );
  <div>
    chart
    <div> {x |> E.Float.toString |> ReasonReact.string} </div>
    <div>
      {Shape.Continuous.findY(x, data)
       |> E.Float.toString
       |> ReasonReact.string}
    </div>
    <div>
      {Shape.Continuous.findY(x, Shape.XYShape.integral(data))
       |> E.Float.toString
       |> ReasonReact.string}
    </div>
  </div>;
};