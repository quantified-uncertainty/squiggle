module Duration = {
  //Stores in Unix milliseconds
  type t = float
  let minute = Belt.Float.fromInt(60 * 1000)
  let hour = Belt.Float.fromInt(60 * 60 * 1000)
  let day = Belt.Float.fromInt(24 * 60 * 60 * 1000)
  let year = Belt.Float.fromInt(24 * 60 * 60 * 1000) *. 365.25
  let fromFloat = (f: float): t => f
  let toFloat = (d: t): float => d
  let fromMinutes = (h: float): t => h *. minute
  let fromHours = (h: float): t => h *. hour
  let fromDays = (d: float): t => d *. day
  let fromYears = (y: float): t => y *. year
  let toMinutes = (t: t): float => t /. minute
  let toHours = (t: t): float => t /. hour
  let toDays = (t: t): float => t /. day
  let toYears = (t: t): float => t /. year

  let toString = (t: t): string => {
    let shouldPluralize = f => f != 1.0
    let display = (f: float, s: string) =>
      `${E.Float.with3DigitsPrecision(f)} ${s}${shouldPluralize(f) ? "s" : ""}`
    let abs = Js.Math.abs_float(t)
    if abs >= year {
      display(t /. year, "year")
    } else if abs >= day {
      display(t /. day, "day")
    } else if abs >= hour {
      display(t /. hour, "hour")
    } else if abs >= minute {
      display(t /. minute, "minute")
    } else {
      E.Float.toFixed(t) ++ "ms"
    }
  }
  let add = (t1: t, t2: t): t => t1 +. t2
  let subtract = (t1: t, t2: t): t => t1 -. t2
  let multiply = (t1: t, t2: float): t => t1 *. t2
  let divide = (t1: t, t2: float): t => t1 /. t2
}

module Date = {
  //The Rescript/JS implementation of Date is pretty mediocre. It would be good to improve upon later.
  type t = Js.Date.t
  let toFloat = Js.Date.getTime
  let getFullYear = Js.Date.getFullYear
  let toString = Js.Date.toDateString
  let fromFloat = Js.Date.fromFloat
  let fmap = (t: t, fn: float => float) => t->toFloat->fn->fromFloat
  let subtract = (t1: t, t2: t) => {
    let (f1, f2) = (toFloat(t1), toFloat(t2))
    let diff = f1 -. f2
    if diff < 0.0 {
      Error("Cannot subtract a date by one that is in its future")
    } else {
      Ok(Duration.fromFloat(diff))
    }
  }
  let addDuration = (t: t, duration: Duration.t) => fmap(t, t => t +. duration)
  let subtractDuration = (t: t, duration: Duration.t) => fmap(t, t => t -. duration)
  //The Js.Date.makeWithYM function accepts a float, but only treats it as a whole number.
  //Our version takes an integer to make this distinction clearer.
  let makeWithYearInt = (y: int): result<t, string> => {
    if y < 100 {
      Error("Year must be over 100")
    } else if y > 200000 {
      Error("Year must be less than 200000")
    } else {
      Ok(Js.Date.makeWithYM(~year=Belt.Float.fromInt(y), ~month=0.0, ()))
    }
  }
  let makeFromYear = (year: float): result<t, string> => {
    let floor = year->Js.Math.floor_float
    makeWithYearInt(Belt.Float.toInt(floor))->E.R.fmap(earlyDate => {
      let diff = year -. floor
      earlyDate->addDuration(diff *. Duration.year)
    })
  }
}
