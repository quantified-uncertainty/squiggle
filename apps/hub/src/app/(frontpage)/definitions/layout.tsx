import { PropsWithChildren } from "react";

import { FrontpageMainAreaLayout } from "../FrontpageMainAreaLayout";

export default function DefinitionsLayout({ children }: PropsWithChildren) {
  return (
    <FrontpageMainAreaLayout title="Definitions">
      {children}
    </FrontpageMainAreaLayout>
  );
}
