open Prop;
let handleChange = (handleChange, event) =>
  handleChange(ReactEvent.Form.target(event)##value);
type onChange = option(Value.t) => unit;

module ConditionalReducer = {
  type action =
    | ADD_OR_UPDATE_CONDITIONAL(Value.conditional)
    | REMOVE_CONDITIONAL(Value.conditional);

  let reducer = (items: array(Value.conditional), action: action) =>
    switch (action) {
    | ADD_OR_UPDATE_CONDITIONAL(conditional) =>
      items->E.A.hasBy(c => c.name == conditional.name)
        ? items
          |> E.A.fmap((r: Value.conditional) =>
               r.name == conditional.name ? conditional : r
             )
        : E.A.append(items, [|conditional|])
    | REMOVE_CONDITIONAL(conditional) =>
      items
      |> E.A.filter((c: Value.conditional) => c.name != conditional.name)
    };
};

[@react.component]
let make =
    (
      ~type_: TypeWithMetadata.t,
      ~value: option(Value.t),
      ~onChange: onChange,
    ) => {
  switch (type_.type_, value) {
  | (Conditionals(l), Some(ConditionalArray(n))) =>
    <div>
      {n
       |> E.A.fmap((r: Value.conditional) =>
            <div
              onClick={_ =>
                onChange(
                  Some(
                    Value.ConditionalArray(
                      ConditionalReducer.reducer(
                        n,
                        REMOVE_CONDITIONAL({name: r.name, truthValue: true}),
                      ),
                    ),
                  ),
                )
              }>
              {r.name |> ReasonReact.string}
              {(r.truthValue ? "TRUE" : "FALSE") |> ReasonReact.string}
            </div>
          )
       |> ReasonReact.array}
      {l.options
       |> E.A.fmap(r =>
            <div
              className="max-w-sm rounded overflow-hidden shadow-sm py-1 px-2 rounded mb-3 bg-gray-200">
              {r |> ReasonReact.string}
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white py-0 px-1 rounded"
                onClick={e => {
                  ReactEvent.Synthetic.preventDefault(e);
                  onChange(
                    Some(
                      Value.ConditionalArray(
                        ConditionalReducer.reducer(
                          n,
                          ADD_OR_UPDATE_CONDITIONAL({
                            name: r,
                            truthValue: true,
                          }),
                        ),
                      ),
                    ),
                  );
                  ();
                }}>
                {"True" |> ReasonReact.string}
              </button>
              <button
                className="hover:bg-red-700 text-white py-0 px-1 rounded bg-red-500"
                onClick={e => {
                  ReactEvent.Synthetic.preventDefault(e);
                  onChange(
                    Some(
                      Value.ConditionalArray(
                        ConditionalReducer.reducer(
                          n,
                          ADD_OR_UPDATE_CONDITIONAL({
                            name: r,
                            truthValue: false,
                          }),
                        ),
                      ),
                    ),
                  );
                }}>
                {"False" |> ReasonReact.string}
              </button>
            </div>
          )
       |> ReasonReact.array}
    </div>
  | (Conditionals(l), _) =>
    l.options |> E.A.fmap(r => r |> ReasonReact.string) |> ReasonReact.array
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