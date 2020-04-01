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
    | CHANCE_OF_EXISTENCE
    | PAYOUTS;

  type conditionals =
    | WORLD_CATASTROPHE;

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
      Some(400000.0),
      Some(100000.0),
    ),
    makeFundWithInfo(
      "Global Health Fund",
      Fund(GLOBAL_HEALTH),
      Some(400000.0),
      Some(100000.0),
    ),
    makeFundWithInfo(
      "Long Term Future Fund",
      Fund(LONG_TERM_FUTURE),
      Some(400000.0),
      Some(100000.0),
    ),
    makeFundWithInfo(
      "Meta Fund",
      Fund(ANIMAL_WELFARE),
      Some(400000.0),
      Some(100000.0),
    ),
    makeFundWithInfo("All", All, None, None),
  |];
};

module Model = {
  open Data;
  let currentYear = 2020.;
  let firstYearStdDev = 400000.;
  type yearlyNumericDiff = {
    meanDiff: float,
    stdDiff: float,
  };

  let yearlyMeanGrowthRateIfNotClosed = (group: group): yearlyNumericDiff => {
    {meanDiff: 1.1, stdDiff: 1.2};
  };

  let calculateDifference =
      (currentValue, dateTime, currentDateTime, y: yearlyNumericDiff) => {
    let yearDiff = MomentRe.diff(dateTime, currentDateTime, `days) /. 365.;
    let meanDiff = Js.Math.pow_float(~base=y.meanDiff, ~exp=yearDiff);
    let stdDevDiff = Js.Math.pow_float(~base=y.stdDiff, ~exp=yearDiff);
    GuesstimatorDist.logNormal(
      currentValue *. meanDiff,
      firstYearStdDev *. stdDevDiff,
    );
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
    | (_, CHANCE_OF_EXISTENCE) => 0.0
    };
  };

  let xRisk = conditionals =>
    Prop.Value.ConditionalArray.get(conditionals, "Global Existential Event");

  // TODO: Fixe number that integral is calculated for
  let getGlobalCatastropheChance = dateTime => {
    GlobalCatastrophe.makeI(MomentRe.momentNow())
    |> DistPlusIngredients.toDistPlus
    |> E.O.bind(_, Distributions.DistPlusTime.Integral.xToY(Time(dateTime)));
  };

  let make =
      (
        group: group,
        dateTime: MomentRe.Moment.t,
        currentDateTime: MomentRe.Moment.t,
        output: output,
        conditionals: array(Prop.Value.conditional),
      ) => {
    let xRisk = xRisk(conditionals);
    switch (output) {
    | DONATIONS
    | PAYOUTS =>
      let difference =
        calculateDifference(
          currentValue(group, output),
          dateTime,
          currentDateTime,
          yearlyMeanGrowthRateIfNotClosed(group),
        );

      let str =
        switch (xRisk) {
        | Some({truthValue: true}) => "0"
        | Some({truthValue: false}) => difference
        | None =>
          let foo =
            getGlobalCatastropheChance(dateTime)
            |> E.O.fmap(r => {
                 let chance = r;
                 let opposite = 1.0 -. r;
                 let reg = difference;
                 {j|mm(0, $reg, [$chance, $opposite])|j};
               });
          foo |> E.O.default("");
        };

      let distPlusIngredients =
        DistPlusIngredients.make(
          ~guesstimatorString=str,
          ~domain=Complete,
          ~unit=UnspecifiedDistribution,
          (),
        );
      Prop.Value.DistPlusIngredients(distPlusIngredients);

    | CHANCE_OF_EXISTENCE =>
      Prop.Value.DistPlusIngredients(
        DistPlusIngredients.make(
          ~guesstimatorString=
            GuesstimatorDist.min(
              GlobalCatastrophe.guesstimatorString,
              GuesstimatorDist.logNormal(20., 2.),
            ),
          ~unit=TimeDistribution({zero: currentDateTime, unit: `years}),
          ~domain=RightLimited({xPoint: 100., excludingProbabilityMass: 0.3}),
          (),
        ),
      )
    };
  };
};

module Interface = {
  open Data;

  let fundKey = "Fund";
  let dayKey = "Day";
  let outputKey = "Output";

  let choiceFromString = (s: string) =>
    funds |> E.A.getBy(_, r => r.name == s);

  let outputFromString = (s: string) =>
    switch (s) {
    | "donations" => DONATIONS
    | "exists" => CHANCE_OF_EXISTENCE
    | _ => PAYOUTS
    };

  let run = (p: array(option(Prop.Value.t))) => {
    switch (p) {
    | [|
        Some(SelectSingle(fund)),
        Some(DateTime(intendedYear)),
        Some(DateTime(currentYear)),
        Some(SelectSingle(output)),
        Some(ConditionalArray(conditionals)),
      |] =>
      choiceFromString(fund)
      |> E.O.fmap(fund =>
           Model.make(
             fund.group,
             intendedYear,
             currentYear,
             outputFromString(output),
             conditionals,
           )
         )
    | _ => None
    };
  };

  let model: Prop.Model.t =
    Prop.{
      id: "ea-funds",
      name: "EA Funds: Donations & Payouts",
      description: "Calculate the payments and payouts of CEA Funds based on existing data.",
      version: "1.0.0",
      fileName: "EAFunds.re",
      author: "Ozzie Gooen",
      inputTypes: [|
        TypeWithMetadata.make(
          ~name=fundKey,
          ~type_=
            SelectSingle({
              default: Some(Array.unsafe_get(Data.funds, 0).name),
              options:
                Data.funds
                |> E.A.fmap((r) =>
                     ({name: r.name, id: r.name}: Prop.Type.selectOption)
                   )
                |> Array.to_list,
            }),
          (),
        ),
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
        TypeWithMetadata.make(
          ~name=outputKey,
          ~type_=
            SelectSingle({
              default: Some("Output"),
              options: [
                {name: "Donations", id: "donations"},
                {name: "Funding", id: "funding"},
                {name: "Closing", id: "exists"},
              ],
            }),
          (),
        ),
        TypeWithMetadata.make(
          ~name="Conditionals",
          ~id="conditionals",
          ~type_=
            Conditionals(
              Prop.Type.makeConditionals(
                [||],
                [|"Global Existential Event"|],
              ),
            ),
          (),
        ),
      |],
      outputTypes: [||],
      run,
    };
};