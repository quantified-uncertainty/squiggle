
@deriving(abstract)
type props
type makeType = props => React.element

@obj 
external makeProps:
  (
    ~onSubmit: ReactEvent.Form.t => unit=?,
    ~hideRequiredMark: bool=?,
    ~id: string=?,
    ~className: string=?,
    ~style: ReactDOMStyle.t=?,
    ~colon: bool=?,
    ~validateStatus: string=?,
    ~extra: string=?,
    ~required: bool=?,
    ~label: string=?,
    ~help: string=?,
    ~hasFeedback: bool=?,
    ~children:React.element=?,
    unit
  ) =>
  props =
  ""


@module("antd")
external make : makeType = "Form"

module Item = {
  type props
  type makeType = props => React.element
  @obj 
  external makeProps:
      (
        ~colon:string=?,
        ~validateStatus:string=?,
        ~extra:string=?,
        ~className:string=?,
        ~required:bool=?,
        ~style:ReactDOMStyle.t=?,
        ~label:string=?,
        ~id:string=?,
        ~help:string=?,
        ~hasFeedback:bool=?,
        ~children:React.element=?,
        unit
      ) => props = ""
  @module("antd/lib/form/FormItem")
  external make : makeType = "default"
}
