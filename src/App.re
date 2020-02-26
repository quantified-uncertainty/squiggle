type route =
  | EAFunds
  | GlobalCatastrophe
  | Home
  | NotFound;

let routeToPath = route =>
  switch (route) {
  | EAFunds => "/ea-funds"
  | GlobalCatastrophe => "/global-catastrophe"
  | Home => "/"
  | _ => "/"
  };

module Menu = {
  module Styles = {
    open Css;
    let menu =
      style([
        position(`relative),
        marginTop(em(0.25)),
        marginBottom(em(0.25)),
        selector(
          "a",
          [
            borderRadius(em(0.25)),
            display(`inlineBlock),
            backgroundColor(`hex("eee")),
            padding(em(1.)),
            cursor(`pointer),
          ],
        ),
        selector("a:hover", [backgroundColor(`hex("bfcad4"))]),
        selector("a:hover", [backgroundColor(`hex("bfcad4"))]),
        selector(
          "a:not(:first-child):not(:last-child)",
          [marginRight(em(0.25)), marginLeft(em(0.25))],
        ),
      ]);
  };

  module Item = {
    [@react.component]
    let make = (~href, ~children) => {
      <a
        href
        onClick={e => {
          e->ReactEvent.Synthetic.preventDefault;
          ReasonReactRouter.push(href);
        }}>
        children
      </a>;
    };
  };

  [@react.component]
  let make = () => {
    <div className=Styles.menu>
      <Item href={routeToPath(Home)} key="home"> {"Home" |> E.ste} </Item>
      <Item href={routeToPath(EAFunds)} key="ea-funds">
        {"EA Funds" |> E.ste}
      </Item>
      <Item href={routeToPath(GlobalCatastrophe)} key="gc">
        {"Global Catastrophe" |> E.ste}
      </Item>
    </div>;
  };
};

[@react.component]
let make = () => {
  let url = ReasonReactRouter.useUrl();

  let routing =
    switch (url.path) {
    | ["ea-funds"] => EAFunds
    | ["global-catastrophe"] => GlobalCatastrophe
    | [] => Home
    | _ => NotFound
    };

  <div className="w-full max-w-screen-xl mx-auto px-6">
    <Menu />
    {switch (routing) {
     | EAFunds => <FormBuilder.ModelForm model=EAFunds.Interface.model />
     | GlobalCatastrophe =>
       <FormBuilder.ModelForm model=GlobalCatastrophe.Interface.model />
     | Home => <div> {"Welcome" |> E.ste} </div>
     | _ => <div> {"Page is not found" |> E.ste} </div>
     }}
  </div>;
};
