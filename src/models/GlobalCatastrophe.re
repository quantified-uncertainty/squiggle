// ~generationSource=GuesstimatorString(,
module Model = {
  let make = (currentDateTime: MomentRe.Moment.t) => {
    let genericDistribution =
      GenericDistribution.make(
        ~generationSource=GuesstimatorString(FloatCdf.logNormal(20., 3.)),
        ~probabilityType=Cdf,
        ~domain=RightLimited({xPoint: 200., excludingProbabilityMass: 0.3}),
        ~unit=Time({zero: currentDateTime, unit: `years}),
        (),
      );
    Prop.Value.GenericDistribution(genericDistribution);
  };
};

module Interface = {
  let dayKey = "Day";

  let run = (p: Prop.Combo.t) => {
    switch (Prop.Combo.InputValues.toValueArray(p)) {
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