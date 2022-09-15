module Map: Benchmark_Helpers.BenchmarkTopic = {
  let arraySize = 1000
  let iterations = 300_000

  let beltArray = () => {
    let x = Belt.Array.make(arraySize, 0.)
    Belt.Range.forEach(1, iterations, _ => {
      let _ = x->Belt.Array.map(v => v)
    })
  }

  let jsArray2 = () => {
    let x = Belt.Array.make(arraySize, 0.)
    Belt.Range.forEach(1, iterations, _ => {
      let _ = x->Js.Array2.map(v => v)
    })
  }

  let ocamlArray = () => {
    let x = Belt.Array.make(arraySize, 0.)
    Belt.Range.forEach(1, iterations, _ => {
      let _ = x->Array.map(v => v, _)
    })
  }

  let runAll = () => {
    Js.log(`Mapping identity function over arrays of size ${arraySize->Js.Int.toString} (${iterations->Js.Int.toString} iterations)`)
    Benchmark_Helpers.measure("Belt.Array.map", beltArray)
    Benchmark_Helpers.measure("Js.Array2.map", jsArray2)
    Benchmark_Helpers.measure("Array.map", ocamlArray)
  }
}

module Sort: Benchmark_Helpers.BenchmarkTopic = {
  let arraySize = 1000
  let iterations = 30000

  let jsArray2 = () => {
    let x = Belt.Array.make(arraySize, 0.)
    let compare = (a: float, b: float) => {
      if a < b {
        -1
      } else {
        1
      }
    }

    Belt.Range.forEach(1, iterations, _ => {
      let _ = x->Js.Array2.sortInPlaceWith(compare)
    })
  }

  let jsArray2withOcamlCompare = () => {
    let x = Belt.Array.make(arraySize, 0.)
    Belt.Range.forEach(1, iterations, _ => {
      let _ = x->Js.Array2.sortInPlaceWith(Pervasives.compare)
    })
  }

  let ocamlArray = () => {
    let x = Belt.Array.make(arraySize, 0.)
    Belt.Range.forEach(1, iterations, _ => {
      let _ = x->Array.fast_sort(compare, _)
    })
  }

  let runAll = () => {
    Js.log(`Sorting arrays of size ${arraySize->Js.Int.toString} (${iterations->Js.Int.toString} iterations)`)
    Benchmark_Helpers.measure("Js.Array2.sort", jsArray2)
    Benchmark_Helpers.measure("Js.Array2.sort with Ocaml compare", jsArray2withOcamlCompare)
    Benchmark_Helpers.measure("Array.fast_sort", ocamlArray)
  }
}

Map.runAll()
Sort.runAll()
