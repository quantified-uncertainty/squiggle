open Jest
open TestHelpers

describe("E.A.getByWithFn", () => {
  makeTest("Empty list returns None", E.A.getByWithFn([], x => x + 1, x => mod(x, 2) == 0), None)
  makeTest(
    "Never predicate returns None",
    E.A.getByWithFn([1, 2, 3, 4, 5, 6], x => x + 1, _ => false),
    None,
  )
  makeTest(
    "function evaluates",
    E.A.getByWithFn([1, 1, 1, 1, 1, 1, 1, 2, 1, 1], x => 3 * x, x => x > 4),
    Some(6),
  )
  makeTest(
    "always predicate returns fn(fst(a))",
    E.A.getByWithFn([0, 1, 2, 3, 4, 5, 6], x => 10 + x, _ => true),
    Some(10),
  )
})
