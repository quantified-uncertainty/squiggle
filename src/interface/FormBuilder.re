open Prop;

type formState = {
  combo: Combo.t,
  setCombo: (Combo.t => Combo.t) => unit,
  setInputValue: (Combo.t, string, option(Value.t)) => unit,
};

let makeHelpers = (combo): formState => {
  let (combo, setCombo) = React.useState(() => combo);
  let setInputValue = (combo, id, newValue) =>
    setCombo(_ => Combo.updateInputValue(combo, id, newValue));
  {combo, setCombo, setInputValue};
};

let propValue = (t: Prop.Value.t) => {
  switch (t) {
  | SelectSingle(r) => r |> ReasonReact.string
  | ConditionalArray(r) => "Array" |> ReasonReact.string
  | DistPlusIngredients((r: DistTypes.distPlusIngredients)) =>
    let newDistribution =
      DistPlusIngredients.toDistPlus(
        ~sampleCount=2000,
        ~outputXYPoints=2000,
        ~truncateTo=Some(100),
        r,
      );
    switch (newDistribution) {
    | Some(distribution) =>
      <div>
        <DistPlusPlot distPlus=distribution />
        {r.guesstimatorString |> ReasonReact.string}
      </div>
    | None => "Something went wrong" |> ReasonReact.string
    };
  | FloatCdf(_) => <div />
  | Probability(r) =>
    (r *. 100. |> Js.Float.toFixed) ++ "%" |> ReasonReact.string
  | DateTime(r) => r |> MomentRe.Moment.defaultFormat |> ReasonReact.string
  | FloatPoint(r) => r |> Js.Float.toFixed |> ReasonReact.string
  };
};

module ModelForm = {
  let handleChange = (handleChange, event) =>
    handleChange(ReactEvent.Form.target(event)##value);

  [@react.component]
  let make = (~model: Model.t) => {
    let formState = makeHelpers(Combo.fromModel(model));
    <div>
      <div
        className="bg-white rounded px-8 pt-6 pb-8 mb-4 mt-6 border-gray-200 border-solid border-2">
        <h1 className="text-gray-800 text-xl font-bold">
          {model.name |> ReasonReact.string}
        </h1>
        <p> {model.description |> ReasonReact.string} </p>
        <p> {model.author |> ReasonReact.string} </p>
        {Combo.inputTypeValuePairs(formState.combo)
         |> E.A.fmap(((type_: TypeWithMetadata.t, value)) =>
              <div className="box-border">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2 w-32 mt-3">
                  {type_.name |> ReasonReact.string}
                </label>
                <ValueForm
                  type_
                  value
                  onChange={newValue =>
                    formState.setInputValue(
                      formState.combo,
                      type_.id,
                      newValue,
                    )
                  }
                />
              </div>
            )
         |> ReasonReact.array}
        <div className="bg-green-100 p-2 rounded-sm mt-6 text-lg">
          {model.run(Prop.Combo.InputValues.toValueArray(formState.combo))
           |> E.O.React.fmapOrNull(propValue)}
        </div>
      </div>
    </div>;
  };
};