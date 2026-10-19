export const cartesianProduct = <A, B>(a: A[], b: B[]): [A, B][] => {
  return a.flatMap((aItem) => b.map<[A, B]>((bItem) => [aItem, bItem]));
};
