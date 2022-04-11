open Jest
open Expect

let makeTest = (~only=false, str, item1, item2) =>
  only
    ? Only.test(str, () => expect(item1)->toEqual(item2))
    : test(str, () => expect(item1)->toEqual(item2))

let {toFloat, toDist, toString, toError, fmap} = module(DistributionOperation.Output)

let fnImage = (theFn, inps) => Js.Array.map(theFn, inps)

let env: DistributionOperation.env = {
  sampleCount: 100000,
  xyPointLength: 1000,
}

let run = DistributionOperation.run(~env)
let outputMap = fmap(~env)
let unreachableInTestFileMessage = "Should be impossible to reach (This error is in test file)"
let toExtFloat: option<float> => float = E.O.toExt(unreachableInTestFileMessage)
let toExtDist: option<GenericDist_Types.genericDist> => GenericDist_Types.genericDist = E.O.toExt(
  unreachableInTestFileMessage,
)
// let toExt: option<'a> => 'a = E.O.toExt(unreachableInTestFileMessage)
let unpackFloat = x => x->toFloat->toExtFloat
let unpackDist = y => y->toDist->toExtDist
