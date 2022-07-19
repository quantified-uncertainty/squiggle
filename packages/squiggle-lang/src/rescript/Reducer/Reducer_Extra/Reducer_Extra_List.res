/*
  Insert seperator between the elements of a list
*/
let rec intersperse = (aList, seperator) =>
  switch aList {
  | list{} => list{}
  | list{a} => list{a}
  | list{a, ...rest} => list{a, seperator, ...intersperse(rest, seperator)}
  }
