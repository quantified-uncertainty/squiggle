type route =
  | DistBuilder
  | NotFound

let routeToPath = route =>
  switch route {
  | DistBuilder => "/"
  | _ => "/"
  }

let fixedLength = r => <div className="w-full max-w-screen-xl mx-auto px-6"> r </div>

@react.component
let make = () => {
  let url = RescriptReactRouter.useUrl()

  let routing = switch url.path {
  | list{} => DistBuilder
  | _ => NotFound
  }

  <>
    {switch routing {
    | DistBuilder => <DistBuilder />
    | _ => fixedLength("Page is not found" |> R.ste)
    }}
  </>
}
