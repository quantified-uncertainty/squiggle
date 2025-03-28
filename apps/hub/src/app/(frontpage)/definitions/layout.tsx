import { PropsWithChildren } from "react";

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
            New Definition
          </LinkButton>
        )
      }
    >
      {children}
    </MainAreaLayout>
  );
}
