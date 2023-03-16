export const interfaceListRoute = () => "/";
export const interfaceRoute = (id: string) => `/interfaces/${id}`;
export const scratchpadRoute = (id: string) => "/scratchpad";
export const modelRoute = (interfaceId: string, modelId: string) =>
  `${interfaceRoute(interfaceId)}/models/${modelId}`;
