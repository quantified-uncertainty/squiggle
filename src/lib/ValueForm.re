open Prop;
let handleChange = (handleChange, event) =>
  handleChange(ReactEvent.Form.target(event)##value);
type onChange = option(Value.t) => unit;

[@react.component]
let make =
    (
      ~type_: TypeWithMetadata.t,
      ~value: option(Value.t),
      ~onChange: onChange,
    ) => {
  switch (type_.type_, value) {
  | (Year(_), Some(FloatPoint(r))) =>
    <input
      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
      type_="number"
      value={r |> Js.Float.toString}
      onChange={handleChange(r =>
        switch (Js.Float.fromString(r)) {
        | r => onChange(Some(Value.FloatPoint(r)))
        }
      )}
    />
  | (FloatPoint(_), Some(FloatPoint(r))) =>
    <input
      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
      type_="number"
      value={r |> Js.Float.toString}
      onChange={handleChange(r =>
        switch (Js.Float.fromString(r)) {
        | r => onChange(Some(Value.FloatPoint(r)))
        }
      )}
    />
  | (BinaryConditional, Some(BinaryConditional(r))) =>
    switch (r) {
    | Unselected =>
      <div
        onClick={_ => onChange(Some(BinaryConditional(Selected(true))))}>
        {"Select" |> ReasonReact.string}
      </div>
    | Selected(true) =>
      <div>
        {"YES!" |> ReasonReact.string}
        <div
          onClick={_ => onChange(Some(BinaryConditional(Selected(false))))}>
          {"No" |> ReasonReact.string}
        </div>
        <div onClick={_ => onChange(Some(BinaryConditional(Unselected)))}>
          {"Deselect" |> ReasonReact.string}
        </div>
      </div>
    | Selected(false) =>
      <div>
        {"NO!" |> ReasonReact.string}
        <div
          onClick={_ => onChange(Some(BinaryConditional(Selected(true))))}>
          {"Yes" |> ReasonReact.string}
        </div>
        <div onClick={_ => onChange(Some(BinaryConditional(Unselected)))}>
          {"Deselect" |> ReasonReact.string}
        </div>
      </div>
    }
  | (Year(_), _)
  | (FloatPoint(_), _) => <input type_="number" value="" />
  | (SelectSingle(t), Some(SelectSingle(r))) =>
    <select
      defaultValue=r
      className="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
      onChange={handleChange(l => onChange(Some(Value.SelectSingle(l))))}>
      {t.options
       |> E.A.of_list
       |> E.A.fmap((l: Type.selectOption) =>
            <option value={l.id} key={l.id}>
              {l.name |> ReasonReact.string}
            </option>
          )
       |> ReasonReact.array}
    </select>
  | (DateTime(_), Some(DateTime((d: MomentRe.Moment.t)))) =>
    <input
      type_="date"
      value={MomentRe.Moment.format("YYYY-MM-DD", d)}
      onChange={handleChange(r =>
        onChange(
          Some(Value.DateTime(MomentRe.momentWithFormat(r, "YYYY-MM-DD"))),
        )
      )}
    />
  };
};