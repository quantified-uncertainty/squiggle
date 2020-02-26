let guesstimatorString = age => GuesstimatorDist.normal(80.0 -. age, 2.);

let makeI = (age: float) => {
  DistPlusIngredients.make(
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
    | [|Some(FloatPoint(age))|] => Some(Model.make(age))
    | _ => None
    };
  };

  let model: Prop.Model.t =
    Prop.{
      name: "Death Time",
      id: "human-lifespan",
      description: "When will you die?",
      version: "1.0.0",
      author: "Ozzie Gooen",
      inputTypes: [|TypeWithMetadata.age|],
      outputTypes: [||],
      run,
    };
};