"use client";
import { allInterfaces } from "@/builtins";
import { InterfaceProvider } from "@/components/Interface/InterfaceProvider";
import { Toolbar } from "@/components/Interface/Toolbar";
import { StyledTab } from "@/components/ui/StyledTab";
import { aboutInterfaceRoute, interfaceRoute } from "@/routes";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { PropsWithChildren } from "react";

export default function InterfaceLayout({
  params,
  children,
}: PropsWithChildren<{
  params: { id: string };
}>) {
  const interfaceWithModels = allInterfaces.find(
    (i) => i.catalog.id === params.id
  );
  if (!interfaceWithModels) {
    return <div className="text-red-500">Not found</div>;
  }

  const { catalog, models } = interfaceWithModels;

  // FIXME - should be rendered on client
  const displayDate = (date?: Date) => {
    return date ? new Date(date).toLocaleDateString() : "";
  };

  const segment = useSelectedLayoutSegment();

  const router = useRouter();

  const selectedIndex = segment === "about" ? 1 : 0;
  const setSelectedIndex = (index: number) => {
    if (index === 0) {
      router.push(interfaceRoute(params.id));
    } else {
      router.push(aboutInterfaceRoute(params.id));
    }
  };

  return (
    <InterfaceProvider initialValue={interfaceWithModels}>
      <div className="bg-blue-100 py-8 px-4">
        <div className="flex justify-between items-start max-w-6xl mx-auto">
          <div>
            <header className="text-2xl font-bold mb-4">{catalog.title}</header>
            <div className="text-sm text-gray-600 space-y-1">
              {catalog.author && (
                <p className="font-semibold">
                  Author: <span className="font-normal">{catalog.author}</span>
                </p>
              )}
              {catalog.created && (
                <p className="font-semibold">
                  Date of Creation:{" "}
                  <span className="font-normal">
                    {displayDate(catalog.created)}
                  </span>
                </p>
              )}
              <p>
                <span className="font-semibold">{catalog.items.length}</span>{" "}
                items
              </p>
              <p>
                <span className="font-semibold">{models.size}</span> models
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-4">
            <StyledTab.Group
              selectedIndex={selectedIndex}
              onChange={setSelectedIndex}
            >
              <StyledTab.List>
                <StyledTab name="Estimates" />
                <StyledTab name="Items" />
              </StyledTab.List>
            </StyledTab.Group>
            <Toolbar />
          </div>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </InterfaceProvider>
  );
}
