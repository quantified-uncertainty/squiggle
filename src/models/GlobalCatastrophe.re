let guesstimatorString = "uniform(1, 100)";

let makeI = (currentDateTime: MomentRe.Moment.t) => {
  DistPlusIngredients.make(
    ~guesstimatorString,
    ~unit=TimeDistribution({zero: currentDateTime, unit: `years}),
    ~domain=RightLimited({xPoint: 300.0, excludingProbabilityMass: 0.3}),
    (),
  );
};
module Model = {
  let make = (currentDateTime: MomentRe.Moment.t) => {
    Prop.Value.DistPlusIngredients(makeI(currentDateTime));
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
      id: "global-catastrophe",
      description: "The chances of having at least one catastrophe per year in the future, assuming no other catastrophe until then.",
      version: "1.0.0",
      author: "Ozzie Gooen",
      inputTypes: [|TypeWithMetadata.currentYear|],
      outputTypes: [||],
      run,
    };
};