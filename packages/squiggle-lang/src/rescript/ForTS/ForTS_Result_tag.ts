export type result<a, b> =
  | {
      tag: "Ok";
      value: a;
    }
  | {
      tag: "Error";
      value: b;
    };
