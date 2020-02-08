open EAFunds_Data;

let handleChange = (handleChange, event) =>
  handleChange(ReactEvent.Form.target(event)##value);

[@react.component]
let make = () => {
  let (year, setYear) = React.useState(() => 2021.);
  <>
    <h1> {"EA Funds Forecasting Model 0.1" |> ReasonReact.string} </h1>
    <input
      type_="number"
      value={year |> Js.Float.toString}
      onChange={handleChange(r =>
        switch (Js.Float.fromString(r)) {
        | r when r >= 2020.0 && r <= 2050.0 => setYear(_ => r)
        | _ => ()
        }
      )}
    />
    <table className="table-auto">
      <thead>
        <tr>
          <th className="px-4 py-2"> {"Fund Name" |> ReasonReact.string} </th>
          <th className="px-4 py-2"> {"Donations" |> ReasonReact.string} </th>
          <th className="px-4 py-2"> {"Payouts" |> ReasonReact.string} </th>
        </tr>
      </thead>
      <tbody>
        {funds
         |> Belt.Array.map(_, r =>
              <tr>
                <th className="px-4 py-2 border ">
                  {r.name |> ReasonReact.string}
                </th>
                <th className="px-4 py-2 border font-normal">
                  {EAFunds_Model.go(r.group, year, DONATIONS)
                   |> Model.InputTypes.to_string
                   |> ReasonReact.string}
                </th>
                <th className="px-4 py-2 border font-normal">
                  {EAFunds_Model.go(r.group, year, PAYOUTS)
                   |> Model.InputTypes.to_string
                   |> ReasonReact.string}
                </th>
              </tr>
            )
         |> ReasonReact.array}
      </tbody>
    </table>
  </>;
};