export const fmap = <A, B>(
  x: A | undefined,
  fn: (v: A) => B
): B | undefined => {
  return x === undefined ? undefined : fn(x);
};
