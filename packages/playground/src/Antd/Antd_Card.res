@deriving(abstract)
type props
type makeType = props => React.element

@obj external makeProps: (
    ~actions: array<React.element>=?,
    ~activeTabKey: string=?,
    ~headStyle: ReactDOMStyle.t=?,
    ~bodyStyle: ReactDOMStyle.t=?,
    ~style: ReactDOMStyle.t=?,
    ~bordered: bool=?,
    ~cover: React.element=?,
    ~defaultActiveTabKey: string=?,
    ~extra: React.element=?,
    ~hoverable: bool=?,
    ~loading: bool=?,
    ~tabList: array<{
                "key": string,
                "tab": React.element,
              }>
                =?,
    ~size: @string [ #default | #small]=?,
    ~title: 'a=?,
    ~_type: string=?,
    ~onTabChange: string => unit=?,
    ~children: React.element=?,
    unit // This unit is a quirk of the type system. Apparently it must exist to have optional arguments in a type
  ) => props = "" 

@module("antd")
external make : makeType = "Card"
