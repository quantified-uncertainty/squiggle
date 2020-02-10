module Data = {
  type fund =
    | ANIMAL_WELFARE
    | GLOBAL_HEALTH
    | LONG_TERM_FUTURE
    | META;

  type group =
    | Fund(fund)
    | All;

  type output =
    | DONATIONS
    | PAYOUTS;

  type fundWithInfo = {
    group,
    name: string,
    existingDonations: option(float),
    existingPayouts: option(float),
  };

  let makeFundWithInfo = (name, group, existingDonations, existingPayouts) => {
    group,
    name,
    existingDonations,
    existingPayouts,
  };

  let funds = [|
    makeFundWithInfo(
      "Animal Welfare Fund",
      Fund(ANIMAL_WELFARE),
      Some(4000.0),
      Some(10.0),
    ),
    makeFundWithInfo(
      "Global Health Fund",
      Fund(GLOBAL_HEALTH),
      Some(4000.0),
      Some(10.0),
    ),
    makeFundWithInfo(
      "Long Term Future Fund",
      Fund(LONG_TERM_FUTURE),
      Some(4000.0),
      Some(10.0),
    ),
    makeFundWithInfo(
      "Meta Fund",
      Fund(ANIMAL_WELFARE),
      Some(4000.0),
      Some(10.0),
    ),
    makeFundWithInfo("All", All, None, None),
  |];
};

module Model = {
  open Data;
  let currentYear = 2020.;
  let firstYearStdDev = 0.2;
  type yearlyNumericDiff = {
    meanDiff: float,
    stdDiff: float,
  };

  let yearlyMeanGrowthRateIfNotClosed = (group: group): yearlyNumericDiff => {
    {meanDiff: 1.1, stdDiff: 1.1};
  };

  let calculateDifference =
      (currentValue, dateTime, currentDateTime, y: yearlyNumericDiff) => {
    let yearDiff = MomentRe.diff(dateTime, currentDateTime, `days) /. 365.;
    let meanDiff = Js.Math.pow_float(~base=y.meanDiff, ~exp=yearDiff);
    let stdDevDiff = Js.Math.pow_float(~base=y.meanDiff, ~exp=yearDiff);
    FloatCdf.normal(currentValue *. meanDiff, firstYearStdDev *. stdDevDiff);
  };

  let rec currentValue = (group: group, output) => {
    let sum = (): float =>
      currentValue(Fund(ANIMAL_WELFARE), output)
      +. currentValue(Fund(GLOBAL_HEALTH), output)
      +. currentValue(Fund(LONG_TERM_FUTURE), output)
      +. currentValue(Fund(META), output);
    switch (group, output) {
    | (Fund(ANIMAL_WELFARE), DONATIONS) => 300000.0
    | (Fund(ANIMAL_WELFARE), PAYOUTS) => 2300000.0
    | (Fund(GLOBAL_HEALTH), DONATIONS) => 1000000.0
    | (Fund(GLOBAL_HEALTH), PAYOUTS) => 500000.0
    | (Fund(LONG_TERM_FUTURE), DONATIONS) => 600000.0
    | (Fund(LONG_TERM_FUTURE), PAYOUTS) => 120000.0
    | (Fund(META), DONATIONS) => 9300000.0
    | (Fund(META), PAYOUTS) => 830000.0
    | (All, _) => sum()
    };
  };
  let make =
      (
        group: group,
        dateTime: MomentRe.Moment.t,
        currentDateTime: MomentRe.Moment.t,
        output: output,
      ) => {
    Prop.Value.FloatCdf(
      calculateDifference(
        currentValue(group, output),
        dateTime,
        currentDateTime,
        yearlyMeanGrowthRateIfNotClosed(group),
      ),
    );
  };
};

module Interface = {
  open Data;
  let convertChoice = (s: string) =>
    switch (s) {
    | "animal" => Fund(ANIMAL_WELFARE)
    | "globalHealth" => Fund(GLOBAL_HEALTH)
    | "longTerm" => Fund(LONG_TERM_FUTURE)
    | "meta" => Fund(META)
    | _ => All
    };

  let convertOutput = (s: string) =>
    switch (s) {
    | "donations" => DONATIONS
    | _ => PAYOUTS
    };

  let run = (p: Prop.Combo.t) => {
    let get = Prop.ValueMap.get(p.inputValues);
    switch (
      get("Fund"),
      get("Day"),
      get(Prop.TypeWithMetadata.currentYear.id),
      get("Output"),
    ) {
    | (
        Some(SelectSingle(fund)),
        Some(DateTime(intendedYear)),
        Some(DateTime(currentYear)),
        Some(SelectSingle(output)),
      ) =>
      Some(
        Model.make(
          convertChoice(fund),
          intendedYear,
          currentYear,
          convertOutput(output),
        ),
      )
    | _ => None
    };
  };

  let model: Prop.Model.t =
    Prop.{
      name: "EA Funds: Donations & Payouts",
      description: "Calculate the payments and payouts of EA Funds based on existing data.",
      version: "1.0.0",
      author: "Ozzie Gooen",
      inputTypes: [|
        TypeWithMetadata.make(
          ~name="Fund",
          ~type_=
            SelectSingle({
              default: Some("total"),
              options: [
                {name: "Animal Welfare Fund", id: "animal"},
                {name: "Global Health Fund", id: "globalHealth"},
                {name: "Long Term Future Fund", id: "longTerm"},
                {name: "Meta Fund", id: "longterm"},
                {name: "All", id: "all"},
              ],
            }),
          (),
        ),
        TypeWithMetadata.make(
          ~name="Day",
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
        TypeWithMetadata.make(
          ~name="Output",
          ~type_=
            SelectSingle({
              default: Some("Output"),
              options: [
                {name: "Donations", id: "donations"},
                {name: "Funding", id: "funding"},
              ],
            }),
          (),
        ),
      |],
      outputTypes: [||],
      run,
    };
};