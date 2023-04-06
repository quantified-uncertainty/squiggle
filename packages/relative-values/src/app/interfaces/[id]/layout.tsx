"use client";
import { InterfaceProvider } from "@/components/Interface/InterfaceProvider";
import { Toolbar } from "@/components/Interface/Toolbar";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import { aboutInterfaceRoute, interfaceRoute } from "@/routes";
import { useInterfaceById } from "@/storage/StorageProvider";
import { PropsWithChildren } from "react";

export default function InterfaceLayout({
  params,
  children,
}: PropsWithChildren<{
  params: { id: string };
}>) {
  const interfaceWithModels = useInterfaceById(params.id);

  // FIXME - should be rendered on client
  const displayDate = (date?: Date) => {
    return date ? new Date(date).toLocaleDateString() : "";
  };

  if (!interfaceWithModels) {
    return <div className="text-red-500">Not found</div>;
  }
  const { catalog, models } = interfaceWithModels;

  const keyValue = (title: String, body: String) => {
    return (
      <div>
        <span className="font-semibold">{title}: </span>
        <span className="font-normal">{body}</span>
      </div>
    );
  };

  return (
    <InterfaceProvider value={{ interfaceId: params.id }}>
      <div className="bg-blue-100 py-8 px-4">
        <div className="flex justify-between items-start max-w-6xl mx-auto">
          <div>
            <header className="text-2xl font-bold mb-2">{catalog.title}</header>
            <div className="text-sm text-gray-700 flex space-x-8">
              {catalog.author && keyValue("Author", catalog.author)}
              {catalog.created &&
                keyValue("Created", displayDate(catalog.created))}
              <div>
                <span className="font-semibold">{catalog.items.length}</span>{" "}
                items
              </div>
              <div>
                <span className="font-semibold">{models.size}</span> estimates
              </div>
            </div>
            {catalog.description && (
              <div className="text-sm text-gray-500 pt-1">
                {catalog.description}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end space-y-4">
            <StyledTabLink.List>
              <StyledTabLink
                name="Estimates"
                href={interfaceRoute(params.id)}
              />
              <StyledTabLink
                name="Items"
                href={aboutInterfaceRoute(params.id)}
              />
            </StyledTabLink.List>
            <Toolbar />
          </div>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </InterfaceProvider>
  );
}
