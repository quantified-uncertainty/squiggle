@deriving(abstract)
type props
type makeType = props => React.element

@obj external makeProps: (
  @as("type") 
  ~htmlType: string=?,
  ~name: string=?,
  ~value: string=?,
  ~defaultValue: string=?,
  ~onChange: ReactEvent.Form.t => unit=?,
  ~onPressEnter: ReactEvent.Keyboard.t => unit=?,
  ~onBlur: ReactEvent.Focus.t => unit=?,
  ~className: string=?,
  ~style: ReactDOMStyle.t=?,
  ~placeholder: string=?,
  unit // This unit is a quirk of the type system. Apparently it must exist to have optional arguments in a type
  ) => props = "" 

@module("antd")
external make : makeType = "Input"
