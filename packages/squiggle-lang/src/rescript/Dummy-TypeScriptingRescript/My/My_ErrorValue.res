type errorValue = EError | EErrorString(string) | EErrorNumber(float)
type t = errorValue

let toString = (e: errorValue): string => {
  switch e {
  | EError => "Error"
  | EErrorString(s) => s
  | EErrorNumber(f) => Js.Float.toString(f)
  }
}
