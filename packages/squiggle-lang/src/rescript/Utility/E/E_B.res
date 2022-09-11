type t = bool
let toString = (t: t) => t ? "TRUE" : "FALSE"
let fromString = str => str == "TRUE" ? true : false

module O = {
  let toBool = opt =>
    switch opt {
    | Some(true) => true
    | _ => false
    }
}
