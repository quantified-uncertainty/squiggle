module Model = {
  let make = (dateTime: MomentRe.Moment.t, currentDateTime: MomentRe.Moment.t) => {
    let yearDiff = MomentRe.diff(dateTime, currentDateTime, `days) /. 365.;
    Prop.Value.Probability((100. -. yearDiff) /. 100.);
  };
};

module Interface = {
  let dayKey = "Day";

  let run = (p: Prop.Combo.t) => {
    switch (Prop.Combo.InputValues.toValueArray(p)) {
    | [|Some(DateTime(intendedYear)), Some(DateTime(currentYear))|] =>
      Some(Model.make(intendedYear, currentYear))
    | _ => None
    };
  };

  let model: Prop.Model.t =
    Prop.{
      name: "Global Catastrophe",
      description: "The chances of catastrophe per year in the future.",
      version: "1.0.0",
      author: "Ozzie Gooen",
      inputTypes: [|
        TypeWithMetadata.make(
          ~name=dayKey,
          ~type_=
            DateTime({
              default:
                Some(
                  MomentRe.Moment.add(
                    ~duration=MomentRe.duration(5., `years),
                    MomentRe.momentNow(),
                  ),
                ),
              min:
                Some(
                  MomentRe.Moment.subtract(
                    ~duration=MomentRe.duration(20., `years),
                    MomentRe.momentNow(),
                  ),
                ),
              max:
                Some(
                  MomentRe.Moment.add(
                    ~duration=MomentRe.duration(20., `years),
                    MomentRe.momentNow(),
                  ),
                ),
            }),
          (),
        ),
        TypeWithMetadata.currentYear,
      |],
      outputTypes: [||],
      run,
    };
};