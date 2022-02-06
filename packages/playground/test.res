@react.component
let make = (
  ~disabled: bool=?,
  ~ghost: bool=?,
  ~href: string=?,
  ~htmlType: @string [#button | #submit | #submit]=?,
  ~icon: 'a=?,
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
) =>
  ReasonReact.cloneElement(
    <AntButton
      _type
      disabled
      ghost
      href
      htmlType
      icon={Antd_Utils.tts(Antd_Icon.iconToJsSafe(~icon, ()))}
      shape
      size
      target
      onClick
      block
      loading
      className
      id>
      children
    </AntButton>,
    ~props={"data-testid": testId},
    [],
  )
