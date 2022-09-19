module type BenchmarkTopic = {
  let runAll: unit => unit
}

let measure = (name: string, f: unit => unit) => {
  let start = Js.Date.make()->Js.Date.valueOf
  f()
  let end = Js.Date.make()->Js.Date.valueOf
  let duration = (end -. start) /. 1000.
  Js.log2(duration, name)
}
