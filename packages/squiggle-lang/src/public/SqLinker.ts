export type SqLinker = {
  resolve: (name: string, fromId: string) => string;
  loadSource: (sourceId: string) => Promise<string>;
  getUrl?: (sourceId: string, varName?: string) => string;
};
