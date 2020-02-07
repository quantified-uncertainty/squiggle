open BsReform;
open EAFunds_Data;

module FormConfig = [%lenses
  type state = {
    group: string,
    year: float,
    parameter: string,
  }
];

module Form = ReForm.Make(FormConfig);

let handleChange = (handleChange, event) =>
  handleChange(ReactEvent.Form.target(event)##value);

module FieldString = {
  [@react.component]
  let make = (~field, ~label) => {
    <Form.Field
      field=FormConfig.Group
      render={({handleChange, value}) =>
        <Antd.Form.Item
          label={"Question Type" |> ReasonReact.string}
          required=true
          help={
            "Number example: 'How many inches of rain will there be tomorrow?' Binary example: 'Will it rain tomorrow?'"
            |> ReasonReact.string
          }>
          <Antd.Radio.Group
            value
            defaultValue=value
            onChange={Helpers.handleChange(handleChange)}>
            <Antd.Radio value="FLOAT">
              {"Number" |> ReasonReact.string}
            </Antd.Radio>
            <Antd.Radio value="PERCENTAGE">
              {"Binary" |> ReasonReact.string}
            </Antd.Radio>
          </Antd.Radio.Group>
        </Antd.Form.Item>
      }
    />;
  };
};

[@react.component]
let make = () => {
  <Antd.Input
    // </Antd.Radio.Group>;
    // <Antd.Radio.Group value=group onChange={handleChange(r => setText(r))}>
    // let (group, setText) = React.useState(() => "");
  />;
};