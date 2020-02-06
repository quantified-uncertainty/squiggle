type fund =
  | ANIMAL_WELFARE
  | GLOBAL_HEALTH
  | LONG_TERM_FUTURE
  | META;

type group =
  | Fund(fund)
  | All;

type parameter =
  | DONATIONS
  | PAYOUTS;

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

  let rec currentValue = (group: group, parameter) => {
    let sum = (): float =>
      currentValue(Fund(ANIMAL_WELFARE), parameter)
      +. currentValue(Fund(GLOBAL_HEALTH), parameter)
      +. currentValue(Fund(LONG_TERM_FUTURE), parameter)
      +. currentValue(Fund(META), parameter);
    switch (group, parameter) {
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

let calculate = (group: group, year: float, parameter: parameter) => {
  PayoutsIfAround.(
    calculateDifference(
      currentValue(group, parameter),
      year,
      yearlyMeanGrowthRateIfNotClosed(group),
    )
  );
};