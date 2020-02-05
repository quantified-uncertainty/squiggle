type senate =
  | DEMOCRAT_VICTORY;

type house =
  | DEMOCRAT_VICTORY;

type statement =
  | Senate(senate)
  | House(house);

type outcome =
  | Bool(bool)
  | Option(string);

type fullStatement = {
  statement,
  outcome,
};

type jointStatement = {
  statements: array(fullStatement),
  probability: option(float),
};

let foo = (joint: jointStatement) => {
  [|
    {
      statements: [|
        {statement: Senate(DEMOCRAT_VICTORY), outcome: Bool(true)},
        {statement: House(DEMOCRAT_VICTORY), outcome: Bool(true)},
      |],
      probability: Some(0.2),
    },
    {
      statements: [|
        {statement: Senate(DEMOCRAT_VICTORY), outcome: Bool(true)},
        {statement: House(DEMOCRAT_VICTORY), outcome: Bool(false)},
      |],
      probability: Some(0.2),
    },
    {
      statements: [|
        {statement: Senate(DEMOCRAT_VICTORY), outcome: Bool(false)},
        {statement: House(DEMOCRAT_VICTORY), outcome: Bool(true)},
      |],
      probability: Some(0.5),
    },
    {
      statements: [|
        {statement: Senate(DEMOCRAT_VICTORY), outcome: Bool(false)},
        {statement: House(DEMOCRAT_VICTORY), outcome: Bool(false)},
      |],
      probability: Some(0.1),
    },
  |];
};