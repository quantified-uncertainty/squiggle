/*
  Insert seperator between the elements of an array
*/
module LE = Reducer_Extra_List

let interperse = (anArray, seperator) =>
  anArray -> Belt.List.fromArray -> LE.interperse(seperator) -> Belt.List.toArray
