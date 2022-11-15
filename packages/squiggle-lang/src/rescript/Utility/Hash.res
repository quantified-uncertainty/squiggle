type t<'a> = array<(string, 'a)>
let getByName = (t: t<'a>, name) => E.A.getBy(t, ((n, _)) => n == name)->E.O.fmap(((_, r)) => r)

let getByNameResult = (t: t<'a>, name) =>
  getByName(t, name)->E.O.toResult(name ++ " expected and not found")

let getByNames = (hash: t<'a>, names: array<string>) =>
  names->E.A.fmap(name => (name, getByName(hash, name)))
