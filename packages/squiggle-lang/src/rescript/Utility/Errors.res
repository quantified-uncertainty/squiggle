type property = {fnName: string, propertyName: string}

type rec error =
  | NotSorted(property)
  | IsEmpty(property)
  | NotFinite(property, float)
  | DifferentLengths({fnName: string, p1Name: string, p2Name: string, p1Length: int, p2Length: int})
  | Multiple(array<error>)

let mapErrorArrayToError = (errors: array<error>): option<error> => {
  switch errors {
  | [] => None
  | [error] => Some(error)
  | _ => Some(Multiple(errors))
  }
}

let rec toString = (t: error) =>
  switch t {
  | NotSorted({fnName, propertyName}) => `${fnName} ${propertyName} is not sorted`
  | IsEmpty({fnName, propertyName}) => `${fnName} ${propertyName} is empty`
  | NotFinite({fnName, propertyName}, exampleValue) =>
    `${fnName} ${propertyName} is not finite. Example value: ${E.Float.toString(exampleValue)}`
  | DifferentLengths({fnName, p1Name, p2Name, p1Length, p2Length}) =>
    `${fnName} ${p1Name} and ${p2Name} have different lengths. ${p1Name} has length ${E.I.toString(
        p1Length,
      )} and ${p2Name} has length ${E.I.toString(p2Length)}`
  | Multiple(errors) =>
    `Multiple Errors: ${E.A2.fmap(errors, toString)->E.A2.fmap(r => `[${r}]`)
        |> E.A.joinWith(", ")}`
  }
