export const interfaceListRoute = () => "/";
export const interfaceRoute = (id: string) => `/interfaces/${id}`;
export const aboutInterfaceRoute = (id: string) => `/interfaces/${id}/about`;
export const newModelRoute = (id: string) => `/interfaces/${id}/new-model`;
export const scratchpadRoute = (id: string) => "/scratchpad";

export const modelRoute = (
  interfaceId: string,
  modelId: string,
  view: "list" | "grid" | "plot" | "edit" = "list"
) => {
  const tail = view === "list" ? "" : `/${view}`;
  return `${interfaceRoute(interfaceId)}/models/${modelId}${tail}`;
};
