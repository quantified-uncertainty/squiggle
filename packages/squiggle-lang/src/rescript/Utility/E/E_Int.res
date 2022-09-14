let max = (i1: int, i2: int) => i1 > i2 ? i1 : i2
let random = (~min, ~max) => Js.Math.random_int(min, max)
