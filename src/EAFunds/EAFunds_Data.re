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