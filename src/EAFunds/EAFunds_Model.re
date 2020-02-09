open EAFunds_Data;

type yearlyNumericDiff = {
  meanDiff: float,
  stdDiff: float,
};

module PayoutsIfAround = {
  let currentYear = 2020.;
  let firstYearStdDev = 0.2;
  let yearDiff = year => year -. 2020.0;

  let yearlyMeanGrowthRateIfNotClosed = (group: group): yearlyNumericDiff => {
    {meanDiff: 1.1, stdDiff: 1.1};
  };

  let calculateDifference =
      (currentValue, yearInQuestion, y: yearlyNumericDiff) => {
    let yearDiff = yearDiff(yearInQuestion);
    let meanDiff = Js.Math.pow_float(~base=y.meanDiff, ~exp=yearDiff);
    let stdDevDiff = Js.Math.pow_float(~base=y.meanDiff, ~exp=yearDiff);
    Math.normal(currentValue *. meanDiff, firstYearStdDev *. stdDevDiff);
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
};

let go = (group: group, year: float, output: output) => {
  PayoutsIfAround.(
    Prop.Value.FloatCdf(
      calculateDifference(
        currentValue(group, output),
        year,
        yearlyMeanGrowthRateIfNotClosed(group),
      ),
    )
  );
};

module Interface = {
  open Prop;

  let model: Model.t = {
    name: "Calculate the payments and payouts of EA Funds based on existing data.",
    author: "George Harrison",
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
        ~name="Year",
        ~type_=
          Year({
            default: Some(2030.0),
            min: Some(2020.0),
            max: Some(2050.0),
          }),
        (),
      ),
      TypeWithMetadata.currentYear,
    |],
    outputTypes: [||],
  };

  let convertChoice = (s: string) =>
    switch (s) {
    | "animal" => Fund(ANIMAL_WELFARE)
    | "globalHealth" => Fund(GLOBAL_HEALTH)
    | "longTerm" => Fund(LONG_TERM_FUTURE)
    | "meta" => Fund(META)
    | _ => All
    };

  let run = (p: Combo.t) => {
    let get = Prop.ValueMap.get(p.inputValues);
    switch (get("Fund"), get("Year")) {
    | (Some(SelectSingle(fund)), Some(FloatPoint(intendedYear))) =>
      Some(go(convertChoice(fund), intendedYear, DONATIONS))
    | _ => None
    };
  };

  module Form = {
    [@react.component]
    let make = () =>
      <Prop.ModelForm combo={Prop.Combo.fromModel(model)} runModel=run />;
  };
};