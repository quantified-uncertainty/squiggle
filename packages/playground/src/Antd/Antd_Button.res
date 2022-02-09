
@deriving(abstract)
type props
type makeType = props => React.element

@obj external makeProps:
    (
  ~disabled: bool=?,
  ~ghost: bool=?,
  ~href: string=?,
  ~htmlType: @string [#button | #submit | #submit]=?,
  ~icon: Antd_IconName.t=?,
  ~shape: @string [#circle | #round]=?,
  ~size: @string [#small | #large]=?,
  ~target: string=?,
  ~loading: bool=?,
  ~_type: @string
  [
    | #primary
    | #default
    | #dashed
    | #danger
    | #link
    | #ghost
  ]=?,
  ~onClick: ReactEvent.Mouse.t => unit=?,
  ~block: bool=?,
  ~children: React.element=?,
  ~className: string=?,
  ~id: string=?,
  ~testId: string=?,
  unit
    ) =>
    props =
    ""

@module("antd")
external make : makeType = "Button"
