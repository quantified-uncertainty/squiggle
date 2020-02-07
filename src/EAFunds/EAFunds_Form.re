open EAFunds_Data;

let handleChange = (handleChange, event) =>
  handleChange(ReactEvent.Form.target(event)##value);

module Form = [%lenses
  type state = {
    group: string,
    year: float,
    output: string,
  }
];

[@react.component]
let make = () => {
  let (form, setForm) =
    React.useState(() =>
      {Form.group: "Animal Welfare Fund", year: 2021., output: "Donations"}
    );
  let (property, setProperty) = React.useState(() => "Donations");
  let foundGroup =
    Belt.Array.getBy(EAFunds_Data.funds, r => r.name === form.group);
  let foundProperty =
    switch (property) {
    | "Donations" => Some(DONATIONS)
    | "Payouts" => Some(PAYOUTS)
    | _ => None
    };
  <>
    <input
      type_="number"
      value={Form.get(form, Year) |> Js.Float.toString}
      onChange={handleChange(r =>
        switch (Js.Float.fromString(r)) {
        | r when r >= 2020.0 && r <= 2050.0 =>
          setForm(_ => Form.set(form, Form.Year, r))
        | _ => ()
        }
      )}
    />
    <Antd.Radio.Group
      value={Form.get(form, Group)}
      onChange={handleChange(r =>
        setForm(_ => Form.set(form, Form.Group, r))
      )}>
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
       | (Some(g), Some(f)) =>
         EAFunds_Model.run(g.group, Form.get(form, Year), f)
       | _ => ""
       }
     )
     |> ReasonReact.string}
  </>;
};