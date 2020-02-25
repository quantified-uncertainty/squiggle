let guesstimatorString = "floor(10 to 20)";

let makeI = (currentDateTime: MomentRe.Moment.t) => {
  DistPlusIngredients.make(
    ~guesstimatorString,
    ~unit=TimeDistribution({zero: currentDateTime, unit: `years}),
    (),
  );
};
module Model = {
  let make = (currentDateTime: MomentRe.Moment.t) => {
    let distPlusIngredients =
      DistPlusIngredients.make(
        ~guesstimatorString,
        ~unit=TimeDistribution({zero: currentDateTime, unit: `years}),
        (),
      );
    Prop.Value.DistPlusIngredients(distPlusIngredients);
  };
};

module Interface = {
  let dayKey = "Day";

  let run = (p: array(option(Prop.Value.t))) => {
    switch (p) {
    | [|Some(DateTime(currentYear))|] => Some(Model.make(currentYear))
    | _ => None
    };
  };

  let model: Prop.Model.t =
    Prop.{
      name: "Global Catastrophe",
      description: "The chances of having at least one catastrophe per year in the future, assuming no other catastrophe until then.",
      version: "1.0.0",
      author: "Ozzie Gooen",
      inputTypes: [|TypeWithMetadata.currentYear|],
      outputTypes: [||],
      run,
    };
};