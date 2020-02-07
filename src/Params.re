type yearAsFloat = {
  min: option(float),
  max: option(float),
};

type namedValue('a) = {
  name: string,
  value: 'a,
};

type choice('a) = list(namedValue('a));

type output =
  | A
  | B;

let nOutput: choice(output) = [{name: "sdfsdf", value: A}];