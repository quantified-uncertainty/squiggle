%%raw(`require("antd/lib/grid/style")`)


module Row = {
  type props

  @obj
  external makeProps:
    (
      ~className: string=?,
      ~_type: string=?,
      ~align: string=?,
      ~justify: string=?,
      ~gutter: 'a=?,
      ~style: ReactDOMStyle.t=?,
      ~prefixCls: string=?,
      ~children: React.element=?,
      unit
    ) =>
    props =
    "";

  type makeType = props => React.element

  @module("antd")
  external make : makeType = "Row"
}

module Col = {
  type props

  @obj
  external makeProps:
    (
      ~className: string=?,
      ~span: int=?,
      ~order: int=?,
      ~offset: int=?,
      ~push: int=?,
      ~pull: int=?,
      ~xs: 'a=?,
      ~sm: 'b=?,
      ~md: 'c=?,
      ~lg: 'd=?,
      ~xl: 'e=?,
      ~xxl: 'f=?,
      ~prefixCls: string=?,
      ~style: ReactDOMStyle.t=?,
      ~children: React.element=?,
      unit
    ) =>
    props =
    "";

  type makeType = props => React.element

  @module("antd")
  external make : makeType = "Col"
}
