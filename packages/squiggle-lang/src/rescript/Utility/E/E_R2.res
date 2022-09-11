module R = E_R

let fmap = (a, b) => R.fmap(b, a)
let bind = (a, b) => R.bind(b, a)

//Converts result type to change error type only
let errMap = (a: result<'a, 'b>, map: 'b => 'c): result<'a, 'c> =>
  switch a {
  | Ok(r) => Ok(r)
  | Error(e) => Error(map(e))
  }

let fmap2 = (xR, f) =>
  switch xR {
  | Ok(x) => x->Ok
  | Error(x) => x->f->Error
  }

let toExn = (a, b) => R.toExn(b, a)
