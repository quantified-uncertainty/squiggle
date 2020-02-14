module Model = {
  let make = (currentDateTime: MomentRe.Moment.t) => {
    let yearsFromNow = "normal(50,30)";
    let dist = CdfLibrary.Distribution.fromString(yearsFromNow, 1000);
    let timeLimitedDomain =
      TimeLimitedDomainCdf.make(
        ~timeVector={zero: currentDateTime, unit: `years},
        ~distribution=dist,
        ~probabilityAtMaxX=0.7,
        ~maxX=`x(200.),
      );
    Prop.Value.TimeLimitedDomainCdf(timeLimitedDomain);
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