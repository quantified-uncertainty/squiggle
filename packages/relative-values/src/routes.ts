import { usePathname } from "next/navigation";

export const interfaceListRoute = () => "/";
export const interfaceRoute = (id: string) => `/interfaces/${id}`;
export const aboutInterfaceRoute = (id: string) => `/interfaces/${id}/about`;
export const newModelRoute = (id: string) => `/interfaces/${id}/new-model`;
export const scratchpadRoute = (id: string) => "/scratchpad";

const views = ["list", "grid", "plot", "edit"] as const;
type View = (typeof views)[number];

export const modelRoute = (
  interfaceId: string,
  modelId: string,
  view: View = "list"
) => {
  const tail = view === "list" ? "" : `/${view}`;
  return `${interfaceRoute(interfaceId)}/models/${modelId}${tail}`;
};

export function useSiblingRoute() {
  const pathname = usePathname();

  return (modelId: string) => {
    const match = pathname?.match(
      `^/interfaces/([^/]+)/models/([^/]+)(?:/(${views
        .filter((v) => v !== "list")
        .join("|")}))?$`
    );

    if (!match) {
      return undefined;
    }

    const interfaceId = match[1];
    const view = match[3] as View | undefined;
    return modelRoute(interfaceId, modelId, view ?? "list");
  };
}
