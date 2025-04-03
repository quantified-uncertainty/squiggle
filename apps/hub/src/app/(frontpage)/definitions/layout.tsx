import { PropsWithChildren } from "react";

import { PlusIcon } from "@quri/ui";

import { LinkButton } from "@/components/ui/LinkButton";
import { newDefinitionRoute } from "@/lib/routes";
import { auth } from "@/lib/server/auth";

import { MainAreaLayout } from "../../../components/layout/MainAreaLayout";

export default async function DefinitionsLayout({
  children,
}: PropsWithChildren) {
  const session = await auth();

  return (
    <MainAreaLayout
      title="Relative Value Definitions"
      actions={
        session && (
          <LinkButton href={newDefinitionRoute()} theme="primary">
            <div className="flex items-center gap-1">
              <PlusIcon size={16} />
              New Definition
            </div>
          </LinkButton>
        )
      }
    >
      {children}
    </MainAreaLayout>
  );
}
