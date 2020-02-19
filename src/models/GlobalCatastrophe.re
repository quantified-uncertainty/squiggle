let guesstimatorString = GuesstimatorDist.logNormal(20., 3.);

module Model = {
  let make = (currentDateTime: MomentRe.Moment.t) => {
    let genericDistribution =
      GenericDistribution.make(
        ~generationSource=GuesstimatorString(guesstimatorString),
        ~probabilityType=Cdf,
        ~domain=RightLimited({xPoint: 200., excludingProbabilityMass: 0.3}),
        ~unit=
          TimeDistribution({
            zero: currentDateTime,
            step: `years,
            length: currentDateTime,
          }),
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
      inputTypes: [|TypeWithMetadata.nextTenYears|],
      outputTypes: [||],
      run,
    };
};