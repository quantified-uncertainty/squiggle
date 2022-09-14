/* Functions */
let pipe = (f, g, x) => g(f(x))
let compose = (f, g, x) => f(g(x))
let flip = (f, a, b) => f(b, a)
let always = (x, _y) => x

let apply = (a, e) => a |> e

let flatten2Callbacks = (fn1, fn2, fnlast) =>
  fn1(response1 => fn2(response2 => fnlast(response1, response2)))

let flatten3Callbacks = (fn1, fn2, fn3, fnlast) =>
  fn1(response1 => fn2(response2 => fn3(response3 => fnlast(response1, response2, response3))))

let flatten4Callbacks = (fn1, fn2, fn3, fn4, fnlast) =>
  fn1(response1 =>
    fn2(response2 =>
      fn3(response3 => fn4(response4 => fnlast(response1, response2, response3, response4)))
    )
  )
