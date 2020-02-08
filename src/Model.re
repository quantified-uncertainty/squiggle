module IOTypes = {
  type singleChoice = {options: list(string)};
  type floatPoint = {validatations: list(float => bool)};
  type withDefault('a) = {default: option('a)};
};

module Input = {
  type parameterType =
    | Year(IOTypes.withDefault(float))
    | SingleChoice(IOTypes.singleChoice)
    | FloatPoint
    | FloatCdf;

  type parameter = {
    name: string,
    parameterType,
  };

  let make = (name, parameterType) => {name, parameterType};
};

module Output = {
  type parameterType =
    | Year
    | SingleChoice(IOTypes.singleChoice)
    | FloatPoint
    | FloatCdf;

  type parameter = {
    name: string,
    parameterType,
  };

  let make = (name, parameterType) => {name, parameterType};
};

type props = {
  name: string,
  author: string,
  assumptions: list(Input.parameter),
  inputs: list(Input.parameter),
  outputs: list(Output.parameter),
};

let model1 = {
  name: "Calculate the payments and payouts of EA Funds based on existing data.",
  author: "George Harrison",
  assumptions: [Input.make("Yearly Growth Rate", FloatPoint)],
  inputs: [
    Input.make(
      "Fund",
      SingleChoice({
        options: [
          "Animal Welfare Fund",
          "Global Health Fund",
          "Long Term Future Fund",
          "Meta Fund",
          "Total",
        ],
      }),
    ),
    {name: "Year", parameterType: Year({default: Some(2030.0)})},
  ],
  outputs: [
    Output.make("Payments", FloatCdf),
    Output.make("Payouts", FloatCdf),
  ],
};