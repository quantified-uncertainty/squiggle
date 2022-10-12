let safe_fn_of_string = (fn, s: string): option<'a> =>
  try Some(fn(s)) catch {
  | _ => None
  }

let safe_float = float_of_string->safe_fn_of_string
let safe_int = int_of_string->safe_fn_of_string
let default = (defaultStr, str) => str == "" ? defaultStr : str
