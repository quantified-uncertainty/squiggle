module StringMap: Benchmark_Helpers.BenchmarkTopic = {
  let size = 1000
  let iterations = 10_000

    let kv = Belt.Array.range(1, size)->Belt.Array.map(
        v => ("key" ++ v->Belt.Int.toString, v)
    )

  let beltMap = () => {
    Belt.Range.forEach(1, iterations, _ => {
        let m = Belt.Map.String.empty
        let _ = Belt.Array.reduce(kv, m, (acc, (k, v)) => acc->Belt.Map.String.set(k, v))
    })
  }

  let beltMutableMap = () => {
    Belt.Range.forEach(1, iterations, _ => {
        let m = Belt.MutableMap.String.make()
        let _ = Belt.Array.reduce(kv, m, (acc, (k, v)) => {
            acc->Belt.MutableMap.String.set(k, v)
            acc
        })
    })
  }

  let beltHashMap = () => {
    Belt.Range.forEach(1, iterations, _ => {
        let m = Belt.HashMap.String.make(~hintSize=100)
        let _ = Belt.Array.reduce(kv, m, (acc, (k, v)) => {
            acc->Belt.HashMap.String.set(k, v)
            acc
        })
    })
  }

  let jsDict = () => {
    Belt.Range.forEach(1, iterations, _ => {
        let m = Js.Dict.empty()
        let _ = Belt.Array.reduce(kv, m, (acc, (k, v)) => {
            acc->Js.Dict.set(k, v)
            acc
        })
    })
  }

  let jsMap = () => {
    Belt.Range.forEach(1, iterations, _ => {
        let m = Js_map.make()
        let _ = Belt.Array.reduce(kv, m, (acc, (k, v)) =>
            acc->Js_map.set(k, v)
        )
    })
  }

  let runAll = () => {
      Js.log(`Filling a map with ("key{i}" => "i") key-value pairs, size ${size->Js.Int.toString} (${iterations->Js.Int.toString} iterations)`)
      Benchmark_Helpers.measure("Belt.Map.String", beltMap)
      Benchmark_Helpers.measure("Belt.MutableMap.String", beltMutableMap)
      Benchmark_Helpers.measure("Belt.HashMap.String", beltHashMap)
      Benchmark_Helpers.measure("Js.Dict", jsDict)
      Benchmark_Helpers.measure("Js.Map", jsMap)
  }
}

let runAll = StringMap.runAll()
