let guesstimatorString = age =>
  GuesstimatorDist.normal(72.0 -. age, 5.0 -. age *. 0.01);

let makeI = (age: float) => {
  RenderTypes.DistPlusRenderer.Ingredients.make(
    ~guesstimatorString=guesstimatorString(age),
    ~unit=TimeDistribution({zero: MomentRe.momentNow(), unit: `years}),
    ~domain=RightLimited({xPoint: 300.0, excludingProbabilityMass: 0.3}),
    (),
  );
};

module Model = {
  let make = (age: float) => {
    Prop.Value.DistPlusIngredients(makeI(age));
  };
};

module Interface = {
  let ageKey = "age";

  let run = (p: array(option(Prop.Value.t))) => {
    switch (p) {
    | [|Some(FloatPoint(age)), Some(SelectSingle(sex))|] =>
      Some(Model.make(age))
    | _ => None
    };
  };

  let model: Prop.Model.t =
    Prop.{
      name: "Death Time",
      id: "human-lifespan",
      fileName: "Human.re",
      description: "When will you die?",
      version: "1.0.0",
      author: "Ozzie Gooen",
      inputTypes: [|TypeWithMetadata.age, TypeWithMetadata.sex|],
      outputTypes: [||],
      run,
    };
};