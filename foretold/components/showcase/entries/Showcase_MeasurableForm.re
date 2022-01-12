open FC;

let cdf: Types.Dist.t = {
  xs: [|0.2, 0.4, 0.6, 0.8, 1.0|],
  ys: [|0.2, 0.3, 0.5, 0.3, 0.2|],
};

let measurableForm = () => <MeasurableForm cdf />;

let entry =
  EntryTypes.(sidebar(~title="Question form", ~render=measurableForm));
