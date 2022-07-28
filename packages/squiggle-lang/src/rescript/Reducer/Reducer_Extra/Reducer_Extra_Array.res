/*
  Insert seperator between the elements of an array
*/
module ExtraList = Reducer_Extra_List

let intersperse = (anArray, seperator) =>
  anArray->Belt.List.fromArray->ExtraList.intersperse(seperator)->Belt.List.toArray
