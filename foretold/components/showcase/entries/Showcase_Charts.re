[@bs.module] external data1: Js.Json.t = "./samples/sample-measurements.json";
[@bs.module]
external data2: Js.Json.t = "./samples/sample-measurements-aggregation.json";

let chart1 = () => <div> <RePercentilesChart data=data1 /> </div>;

let chart2 = () => <div> <RePercentilesChart data=data2 /> </div>;

let entries =
  EntryTypes.[
    folder(
      ~title="Charts",
      ~children=[
        entry(~title="Chart 1", ~render=chart1),
        entry(~title="Chart 2", ~render=chart2),
      ],
    ),
  ];