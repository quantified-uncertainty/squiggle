type expectedResolutionDate = MomentRe.Moment.t;
type resolutionDate = MomentRe.Moment.t;

module State = {
  type t =
    | OPEN(expectedResolutionDate)
    | PENDING(expectedResolutionDate)
    | RESOLVED(resolutionDate);

  let toColor = (t: t) =>
    switch (t) {
    | OPEN(_) => Settings.Statuses.green
    | PENDING(_) => Settings.Statuses.yellow
    | RESOLVED(_) => Settings.Statuses.resolved
    };

  let toText = (t: t) =>
    switch (t) {
    | OPEN(_) => "Open"
    | PENDING(_) => "Pending"
    | RESOLVED(_) => "Resolved"
    };

  let toSubtext = (t: t) =>
    switch (t) {
    | OPEN(time) =>
      "Resolves " ++ MomentRe.Moment.fromNow(time, ~withoutSuffix=None)
    | PENDING(time) =>
      "Pending since " ++ MomentRe.Moment.fromNow(time, ~withoutSuffix=None)
    | RESOLVED(time) =>
      "Resolved " ++ MomentRe.Moment.fromNow(time, ~withoutSuffix=None)
    };
};

module Style = {
  let token = (state, fontSize') =>
    Css.(
      style([
        Settings.FontWeights.heavy,
        color(State.toColor(state)),
        marginRight(`em(1.0)),
        fontSize(fontSize'),
      ])
    );

  let text = fontSize' =>
    Css.(style([color(Settings.accentBlue), fontSize(fontSize')]));
};

let make = (~state: State.t, ~fontSize=`em(0.9), ()) =>
  <div>
    <span className={Style.token(state, fontSize)}>
      {State.toText(state) |> ReasonReact.string}
    </span>
    <span className={Style.text(fontSize)}>
      {State.toSubtext(state) |> ReasonReact.string}
    </span>
  </div>;
