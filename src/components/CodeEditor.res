type props
@obj external makeProps : (~value:string=?, ~onChange: string => unit, ~children: React.element=?, unit) => props = ""

@module("./CodeEditor.js")
external make: props => React.element = "CodeEditor"
