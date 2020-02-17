open ForetoldComponents.Base;

let data: DistributionTypes.xyShape = {
  xs: [|0.2, 20., 80., 212., 330.|],
  ys: [|0.0, 0.3, 0.5, 0.2, 0.1|],
};

let alerts = () =>
  <div>
    <div> <ChartWithNumber data color={`hex("333")} /> </div>
    <div>
      <ChartWithNumber
        data={data |> Shape.XYShape.integral}
        color={`hex("333")}
      />
    </div>
  </div>;

let entry = EntryTypes.(entry(~title="Pdf", ~render=alerts));