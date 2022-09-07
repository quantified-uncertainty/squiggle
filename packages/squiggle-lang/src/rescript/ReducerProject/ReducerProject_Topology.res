module ProjectItem = ReducerProject_ProjectItem
module T = ReducerProject_T
type t = T.Private.t

let getSourceIds = T.Private.getSourceIds
let getItem = T.Private.getItem

let getImmediateDependencies = (this: t, sourceId: string): ProjectItem.T.includesType =>
  getItem(this, sourceId)->ProjectItem.getImmediateDependencies

type topologicalSortState = (Belt.Map.String.t<bool>, list<string>)
let rec topologicalSortUtil = (
  this: t,
  sourceId: string,
  state: topologicalSortState,
): topologicalSortState => {
  let dependencies = getImmediateDependencies(this, sourceId)->Belt.Result.getWithDefault([])
  let (visited, stack) = state
  let myVisited = Belt.Map.String.set(visited, sourceId, true)
  let (newVisited, newStack) = dependencies->Belt.Array.reduce((myVisited, stack), (
    (currVisited, currStack),
    dependency,
  ) => {
    if !Belt.Map.String.getWithDefault(currVisited, dependency, false) {
      topologicalSortUtil(this, dependency, (currVisited, currStack))
    } else {
      (currVisited, currStack)
    }
  })
  (newVisited, list{sourceId, ...newStack})
}

let getTopologicalSort = (this: t): array<string> => {
  let (_visited, stack) = getSourceIds(this)->Belt.Array.reduce((Belt.Map.String.empty, list{}), (
    (currVisited, currStack),
    currId,
  ) =>
    if !Belt.Map.String.getWithDefault(currVisited, currId, false) {
      topologicalSortUtil(this, currId, (currVisited, currStack))
    } else {
      (currVisited, currStack)
    }
  )
  Belt.List.reverse(stack)->Belt.List.toArray
}

let getRunOrder = getTopologicalSort

let getRunOrderFor = (this: t, sourceId) => {
  let (_visited, stack) = topologicalSortUtil(this, sourceId, (Belt.Map.String.empty, list{}))
  Belt.List.reverse(stack)->Belt.List.toArray
}

let getDependencies = (this: t, sourceId: string): array<string> => {
  let runOrder = getTopologicalSort(this)
  let index = runOrder->Js.Array2.indexOf(sourceId)
  Js.Array2.slice(runOrder, ~start=0, ~end_=index)
}

let getDependents = (this: t, sourceId: string): array<string> => {
  let runOrder = getTopologicalSort(this)
  let index = runOrder->Js.Array2.indexOf(sourceId)
  Belt.Array.sliceToEnd(runOrder, index + 1)
}

let runOrderDiff = (current: array<string>, previous0: array<string>): array<string> => {
  let extraLength =
    Belt.Array.length(current) > Belt.Array.length(previous0)
      ? Belt.Array.length(current) - Belt.Array.length(previous0)
      : 0
  let previous = Belt.Array.copy(previous0)
  let filler = Belt.Array.make(extraLength, "")
  Belt.Array.forEach(filler, _ => {
    let _ = Js.Array2.push(previous, "")
  })
  let zipped: array<(string, string)> = Belt.Array.zip(current, previous)

  // zipped
  // ->Belt.Array.map(((curr, prev)) => {
  //   let result = `(${curr}, ${prev})`
  //   result
  // })
  // ->Js.Array2.joinWith(", ")
  // ->Js.log

  let (_, affected) = Belt.Array.reduce(zipped, (true, []), ((wasEqual, acc), (curr, prev)) => {
    switch wasEqual {
    | true =>
      if curr == prev {
        (true, acc)
      } else {
        (false, Belt.Array.concat(acc, [curr]))
      }
    | false => (false, Belt.Array.concat(acc, [curr]))
    }
  })
  affected
}
