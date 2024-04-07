export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { [key: string]: JsonValue };
