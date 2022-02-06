type route =
  | DistBuilder
  | Home
  | NotFound

let routeToPath = route =>
  switch route {
  | DistBuilder => "/dist-builder"
  | Home => "/"
  | _ => "/"
  }

module Menu = {
  module Styles = {
    open CssJs
    let menu = style(. [ position(#relative),
    marginTop(em(0.25)),
    marginBottom(em(0.25)),
    selector(.
      "a",
      [ borderRadius(em(0.25)),
      display(#inlineBlock),
      backgroundColor(#hex("eee")),
      padding(em(1.)),
      cursor(#pointer),
    ],
    ),
    selector(. "a:hover", [ backgroundColor(#hex("bfcad4")) ]),
    selector(. "a:hover", [ backgroundColor(#hex("bfcad4")) ]),
    selector(.
      "a:not(:firstChild):not(:lastChild)",
      [ marginRight(em(0.25)), marginLeft(em(0.25)) ],
    ),
  ])
  }

  module Item = {
    @react.component
    let make = (~href, ~children) =>
      <a
        href
        onClick={e => {
          e->ReactEvent.Synthetic.preventDefault
          RescriptReactRouter.push(href)
        }}>
        children
      </a>
  }

  @react.component
  let make = () =>
    <div style=Styles.menu>
      <Item href={routeToPath(Home)} key="home"> {"Home" |> R.ste} </Item>
      <Item href={routeToPath(DistBuilder)} key="dist-builder"> {"Dist Builder" |> R.ste} </Item>
    </div>
}

let fixedLength = r => <div className="w-full max-w-screen-xl mx-auto px-6"> r </div>

@react.component
let make = () => {
  let url = RescriptReactRouter.useUrl()

  let routing = switch url.path {
  | list{"dist-builder"} => DistBuilder
  | list{} => Home
  | _ => NotFound
  }

  <>
    <Menu />
    {switch routing {
    | DistBuilder => <DistBuilder />
    | Home => <Home />
    | _ => fixedLength("Page is not found" |> R.ste)
    }}
  </>
}
