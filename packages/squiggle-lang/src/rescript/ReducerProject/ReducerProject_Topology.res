module ProjectItem = ReducerProject_ProjectItem
module T = ReducerProject_T
type t = T.t

let getSourceIds = T.getSourceIds
let getItem = T.getItem

let getImmediateDependencies = (this: t, sourceId: string): ProjectItem.T.includesType =>
  this->getItem(sourceId)->ProjectItem.getImmediateDependencies

type topologicalSortState = (Belt.Map.String.t<bool>, list<string>)
let rec topologicalSortUtil = (
  this: t,
  sourceId: string,
  state: topologicalSortState,
): topologicalSortState => {
  let dependencies = getImmediateDependencies(this, sourceId)->Belt.Result.getWithDefault([])
  let (visited, stack) = state
  let myVisited = Belt.Map.String.set(visited, sourceId, true)
  let (newVisited, newStack) = dependencies->E.A.reduce((myVisited, stack), (
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
  let (_visited, stack) =
    this
    ->getSourceIds
    ->E.A.reduce((Belt.Map.String.empty, list{}), ((currVisited, currStack), currId) =>
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
    E.A.length(current) > E.A.length(previous0) ? E.A.length(current) - E.A.length(previous0) : 0
  let previous = Belt.Array.copy(previous0)
  let filler = Belt.Array.make(extraLength, "")
  E.A.forEach(filler, _ => {
    let _ = Js.Array2.push(previous, "")
  })
  let zipped: array<(string, string)> = E.A.zip(current, previous)

  // zipped
  // ->E.A.fmap(((curr, prev)) => {
  //   let result = `(${curr}, ${prev})`
  //   result
  // })
  // ->Js.Array2.joinWith(", ")
  // ->Js.log

  let (_, affected) = E.A.reduce(zipped, (true, []), ((wasEqual, acc), (curr, prev)) => {
    switch wasEqual {
    | true =>
      if curr == prev {
        (true, acc)
      } else {
        (false, E.A.concat(acc, [curr]))
      }
    | false => (false, E.A.concat(acc, [curr]))
    }
  })
  affected
}
