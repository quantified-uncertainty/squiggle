let guesstimatorString = "20 to 80";

module Model = {
  let make = (currentDateTime: MomentRe.Moment.t) => {
    let genericDistribution =
      GenericDistribution.make(
        ~generationSource=GuesstimatorString(guesstimatorString),
        ~probabilityType=Cdf,
        ~unit=TimeDistribution({zero: currentDateTime, unit: `years}),
        (),
      );
    Prop.Value.GenericDistribution(genericDistribution);
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