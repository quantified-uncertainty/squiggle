/* List */

let uniq = xs => {
  Belt.List.reduce(xs, list{}, (acc, v) =>
    Belt.List.some(acc, \"=="(v)) ? acc : Belt.List.concat(list{v}, acc)
  )
}

let combinations2: list<'a> => list<('a, 'a)> = xs => {
  let rec loop: ('a, list<'a>) => list<('a, 'a)> = (x', xs') => {
    let n = Belt.List.length(xs')
    if n == 0 {
      list{}
    } else {
      let combs = Belt.List.map(xs', y => (x', y))
      let hd = Belt.List.headExn(xs')
      let tl = Belt.List.tailExn(xs')
      Belt.List.concat(combs, loop(hd, tl))
    }
  }
  switch (Belt.List.head(xs), Belt.List.tail(xs)) {
  | (Some(x'), Some(xs')) => loop(x', xs')
  | (_, _) => list{}
  }
}
