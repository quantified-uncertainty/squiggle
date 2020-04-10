type route =
  | Model(string);

let routeToPath = route =>
  switch (route) {
  | Model(modelId) => "/m/" ++ modelId
  };

module Models = {
  let all = [|
    EAFunds.Interface.model,
    GlobalCatastrophe.Interface.model,
    Human.Interface.model,
  |];
  let getById = id => E.A.getBy(all, r => r.id == id);
};

module Styles = {
  open Css;
  let h3 = style([fontSize(`em(1.5)), marginBottom(`em(1.5))]);
  let card = style([marginTop(`em(2.)), marginBottom(`em(2.))]);
};

module Table = {
  module TableStyles = {
    open Css;
    let row = style([display(`flex), height(`em(4.))]);
    let col = (~f=1.0, ()) => {
      style([flex(`num(f))]);
    };
  };

  module Item = {
    [@react.component]
    let make = (~model: Prop.Model.t, ~children) => {
      <div className=TableStyles.row>
        <div className={TableStyles.col()}>
          <a
            href={routeToPath(Model(model.id))}
            onClick={e => {
              e->ReactEvent.Synthetic.preventDefault;
              ReasonReactRouter.push(routeToPath(Model(model.id)));
            }}>
            children
          </a>
        </div>
        <div className={TableStyles.col(~f=3.0, ())}>
          {model.description |> E.ste}
        </div>
        <div className={TableStyles.col()}> {model.author |> E.ste} </div>
      </div>;
    };
  };

  module ColumnsTitles = {
    [@react.component]
    let make = () => {
      <div className=TableStyles.row>
        <div className={TableStyles.col()}> {"Name" |> E.ste} </div>
        <div className={TableStyles.col(~f=3.0, ())}>
          {"Description" |> E.ste}
        </div>
        <div className={TableStyles.col()}> {"Author" |> E.ste} </div>
      </div>;
    };
  };

  [@react.component]
  let make = () => {
    <>
      <h3 className=Styles.h3> {"Probability Models" |> E.ste} </h3>
      <ColumnsTitles />
      {Models.all
       |> E.A.fmap((model: Prop.Model.t) => {
            <Item model key={model.id}> {model.name |> E.ste} </Item>
          })
       |> ReasonReact.array}
    </>;
  };
};

[@react.component]
let make = () => {
  <div> <div className=Styles.card> <Table /> </div> </div>;
};