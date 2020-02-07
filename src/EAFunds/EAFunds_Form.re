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

[@react.component]
let make = () => {
  let (group, setGroup) = React.useState(() => "Animal Welfare Fund");
  let (year, setYear) = React.useState(() => 0.3);
  let (property, setProperty) = React.useState(() => "Donations");
  let foundGroup = Belt.Array.getBy(EAFunds_Data.funds, r => r.name === group);
  let foundProperty =
    switch (property) {
    | "Donations" => Some(DONATIONS)
    | "Payouts" => Some(PAYOUTS)
    | _ => None
    };
  <>
    <Antd.Radio.Group value=group onChange={handleChange(r => setGroup(r))}>
      {EAFunds_Data.funds
       |> Array.map(f =>
            <Antd.Radio value={f.name}>
              {f.name |> ReasonReact.string}
            </Antd.Radio>
          )
       |> ReasonReact.array}
    </Antd.Radio.Group>
    <Antd.Radio.Group
      value=property onChange={handleChange(r => setProperty(r))}>
      <Antd.Radio value="Donations">
        {"Donations" |> ReasonReact.string}
      </Antd.Radio>
      <Antd.Radio value="Payouts">
        {"Payouts" |> ReasonReact.string}
      </Antd.Radio>
    </Antd.Radio.Group>
    {(
       switch (foundGroup, foundProperty) {
       | (Some(g), Some(f)) => EAFunds_Model.run(g.group, 2029., f)
       | _ => ""
       }
     )
     |> ReasonReact.string}
  </>;
};