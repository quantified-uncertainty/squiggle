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
  let (year, setYear) = React.useState(() => 2021.);
  <>
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
                  {EAFunds_Model.run(r.group, year, DONATIONS)
                   |> ReasonReact.string}
                </th>
                <th className="px-4 py-2 border font-normal">
                  {EAFunds_Model.run(r.group, year, PAYOUTS)
                   |> ReasonReact.string}
                </th>
              </tr>
            )
         |> ReasonReact.array}
      </tbody>
    </table>
  </>;
};