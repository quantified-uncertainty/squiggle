type fund =
  | ANIMAL_WELFARE
  | GLOBAL_HEALTH
  | LONG_TERM_FUTURE
  | META;

type group =
  | Fund(fund)
  | All;

type parameter =
  | CHANCE_CLOSED
  | DONATIONS
  | PAYOUTS;

type yearlyNumericDiff = {
  meanDiff: float,
  stdDiff: float,
};

module PayoutsIfAround = {
  let yearlyMeanGrowthRateIfNotClosed = (group: group): yearlyNumericDiff => {
    {meanDiff: 1.1, stdDiff: 1.1};
  };

  let yearlyChanceOfClosing = (group: group) => {
    0.1;
  };

  let yearlyStdevGrowthRate = (group: group, year: int, parameter: parameter) => {
    switch (group) {
    | Fund(ANIMAL_WELFARE) => (30, 30)
    | Fund(GLOBAL_HEALTH) => (30, 30)
    | Fund(LONG_TERM_FUTURE) => (30, 30)
    | Fund(META) => (30, 30)
    | All => (50, 10)
    };
  };
};