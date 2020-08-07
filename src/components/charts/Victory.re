type victoryData = {
  .
  "x": int,
  "y": int,
};

module VictoryTheme = {
  type t;
  [@bs.module "victory-core/es/victory-theme/material"] [@bs.val]
  external material : t = "default";
  [@bs.module "victory-core/es/victory-theme/grayscale"] [@bs.val]
  external grayscale : t = "default";
};

module VictoryBar = {
  [@bs.module "victory"]
  external victoryBar : ReasonReact.reactClass = "VictoryBar";
  let make = (~data=?, children) =>
    ReasonReact.wrapJsForReason(
      ~reactClass=victoryBar,
      ~props={"data": Js.Undefined.fromOption(data)},
      children,
    );
};

module VictoryStack = {
  [@bs.module "victory"]
  external victoryStack : ReasonReact.reactClass = "VictoryStack";
  let make = (~colorScale=?, children) =>
    ReasonReact.wrapJsForReason(
      ~reactClass=victoryStack,
      ~props={"colorScale": Js.Undefined.fromOption(colorScale)},
      children,
    );
};

module VictoryChart = {
  [@bs.module "victory"]
  external victoryChart : ReasonReact.reactClass = "VictoryChart";
  [@react.component]
  let make =
      (
        ~domainPadding=?,
        ~theme: option(VictoryTheme.t)=?,
        ~scale=?,
        ~maxDomain=?,
        ~minDomain=?,
        ~padding=?,
        ~height=?,
        ~width=?,
        ~children=ReasonReact.null
      ) =>
    ReasonReact.wrapJsForReason(
      ~reactClass=victoryChart,
      ~props={
        "domainPadding": Js.Undefined.fromOption(domainPadding),
        "theme": Js.Undefined.fromOption(theme),
        "scale": Js.Undefined.fromOption(scale),
        "maxDomain": Js.Undefined.fromOption(maxDomain),
        "minDomain": Js.Undefined.fromOption(minDomain),
        "padding": Js.Undefined.fromOption(padding),
        "height": Js.Undefined.fromOption(height),
        "width": Js.Undefined.fromOption(width),
      },
      children,
    ) |> ReasonReact.element
};

module VictoryLine = {
  [@bs.module "victory"]
  external victoryLine : ReasonReact.reactClass = "VictoryLine";

  [@react.component]
  let make = (~data=?, ~style=?, ~children=ReasonReact.null) =>
    ReasonReact.wrapJsForReason(
      ~reactClass=victoryLine,
      ~props={
        "data": Js.Undefined.fromOption(data),
        "style": Js.Undefined.fromOption(style),
      },
      children,
    ) |> ReasonReact.element

};


module VictoryAxis = {
  [@bs.module "victory"]
  external victoryAxis : ReasonReact.reactClass = "VictoryAxis";

  [@react.component]
  let make =
      (
        ~tickValues=?,
        ~height=?,
        ~style=?,
        ~scale=?,
        ~tickFormat: option('a => string)=?,
        ~dependentAxis: option(bool)=?,
        ~children=ReasonReact.null,
      ) =>
    ReasonReact.wrapJsForReason(
      ~reactClass=victoryAxis,
      ~props={
        "height": Js.Undefined.fromOption(height),
        "tickValues": Js.Undefined.fromOption(tickValues),
        "tickFormat": Js.Undefined.fromOption(tickFormat),
        "dependentAxis": Js.Undefined.fromOption(dependentAxis),
        "style": Js.Undefined.fromOption(style),
        "scale": Js.Undefined.fromOption(scale),
      },
      children,
    ) |> ReasonReact.element
};

module VictoryArea = {
  [@bs.module "victory"]
  external victoryArea : ReasonReact.reactClass = "VictoryArea";
  let make =
      (~animate=?, ~data=?, ~interpolation="linear", ~style=?, children) =>
    ReasonReact.wrapJsForReason(
      ~reactClass=victoryArea,
      ~props={
        "animate": Js.Undefined.fromOption(animate),
        "data": Js.Undefined.fromOption(data),
        "style": Js.Undefined.fromOption(style),
        "interpolation": interpolation,
      },
      children,
    );
};
module VictoryScatter = {
  [@bs.module "victory"]
  external victoryScatter : ReasonReact.reactClass = "victoryScatter";
  let make = (~data=?, ~style=?, children) =>
    ReasonReact.wrapJsForReason(
      ~reactClass=victoryScatter,
      ~props={
        "data": Js.Undefined.fromOption(data),
        "style": Js.Undefined.fromOption(style),
      },
      children,
    );
};