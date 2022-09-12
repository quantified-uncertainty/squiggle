// open ReducerInterface_InternalExpressionValue

// let typeModifier_memberOf = (aType, anArray) => {
//   let newRecord = Belt.Map.String.fromArray([
//     ("typeTag", IEvString("typeIdentifier")),
//     ("typeIdentifier", aType),
//   ])
//   newRecord->Belt.Map.String.set("memberOf", anArray)->IEvType->Ok
// }

// let typeModifier_memberOf_update = (aRecord, anArray) => {
//   aRecord->Belt.Map.String.set("memberOf", anArray)->IEvType->Ok
// }

// let typeModifier_min = (aType, value) => {
//   let newRecord = Belt.Map.String.fromArray([
//     ("typeTag", IEvString("typeIdentifier")),
//     ("typeIdentifier", aType),
//   ])
//   newRecord->Belt.Map.String.set("min", value)->IEvType->Ok
// }

// let typeModifier_min_update = (aRecord, value) => {
//   aRecord->Belt.Map.String.set("min", value)->IEvType->Ok
// }

// let typeModifier_max = (aType, value) => {
//   let newRecord = Belt.Map.String.fromArray([
//     ("typeTag", IEvString("typeIdentifier")),
//     ("typeIdentifier", aType),
//   ])
//   newRecord->Belt.Map.String.set("max", value)->IEvType->Ok
// }

// let typeModifier_max_update = (aRecord, value) =>
//   aRecord->Belt.Map.String.set("max", value)->IEvType->Ok

// let typeModifier_opaque_update = aRecord =>
//   aRecord->Belt.Map.String.set("opaque", IEvBool(true))->IEvType->Ok

// let typeOr = evArray => {
//   let newRecord = Belt.Map.String.fromArray([("typeTag", IEvString("typeOr")), ("typeOr", evArray)])
//   newRecord->IEvType->Ok
// }

// let typeFunction = anArray => {
//   let output = Belt.Array.getUnsafe(anArray, Js.Array2.length(anArray) - 1)
//   let inputs = Js.Array2.slice(anArray, ~start=0, ~end_=-1)
//   let newRecord = Belt.Map.String.fromArray([
//     ("typeTag", IEvString("typeFunction")),
//     ("inputs", IEvArray(inputs)),
//     ("output", output),
//   ])
//   newRecord->IEvType->Ok
// }

// let typeArray = element => {
//   let newRecord = Belt.Map.String.fromArray([
//     ("typeTag", IEvString("typeArray")),
//     ("element", element),
//   ])
//   newRecord->IEvType->Ok
// }

// let typeTuple = anArray => {
//   let newRecord = Belt.Map.String.fromArray([
//     ("typeTag", IEvString("typeTuple")),
//     ("elements", IEvArray(anArray)),
//   ])
//   newRecord->IEvType->Ok
// }

// let typeRecord = propertyMap => {
//   let newProperties = propertyMap->IEvRecord
//   let newRecord = Belt.Map.String.fromArray([
//     ("typeTag", IEvString("typeRecord")),
//     ("properties", newProperties),
//   ])
//   newRecord->IEvType->Ok
// }

