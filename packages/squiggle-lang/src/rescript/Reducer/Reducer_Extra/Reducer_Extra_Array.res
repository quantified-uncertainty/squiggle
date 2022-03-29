/*
  Insert seperator between the elements of an array
*/
module ExtraList = Reducer_Extra_List

let interperse = (anArray, seperator) =>
  anArray->Belt.List.fromArray->ExtraList.interperse(seperator)->Belt.List.toArray
