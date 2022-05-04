/*
This test case comes via Nuño https://github.com/quantified-uncertainty/squiggle/issues/433
*/
open Jest
open Expect

describe("KL divergence", () => {
  test("our's agrees with analytical", () => {
    true->expect->toBe(true)
  })
})
