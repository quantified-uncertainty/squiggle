/*
  Insert seperator between the elements of a list
*/
let rec interperse = (aList, seperator) => switch aList {
  | list{} => list{}
  | list{a} => list{a}
  | list{a, ...rest} => list{a, seperator, ...interperse(rest, seperator)}
}
