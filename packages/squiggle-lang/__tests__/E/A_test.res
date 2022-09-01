open Jest
open TestHelpers

describe("E.A.getByFmap", () => {
  makeTest("Empty list returns None", E.A.getByFmap([], x => x + 1, x => mod(x, 2) == 0), None)
  makeTest(
    "Never predicate returns None",
    E.A.getByFmap([1, 2, 3, 4, 5, 6], x => x + 1, _ => false),
    None,
  )
  makeTest(
    "function evaluates",
    E.A.getByFmap([1, 1, 1, 1, 1, 1, 1, 2, 1, 1], x => 3 * x, x => x > 4),
    Some(6),
  )
  makeTest(
    "always predicate returns fn(fst(a))",
    E.A.getByFmap([0, 1, 2, 3, 4, 5, 6], x => 10 + x, _ => true),
    Some(10),
  )
})
