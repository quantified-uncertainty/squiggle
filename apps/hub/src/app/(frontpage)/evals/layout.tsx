import { PropsWithChildren } from "react";

import { FrontpageMainAreaLayout } from "../FrontpageMainAreaLayout";

export default function EvalsLayout({ children }: PropsWithChildren) {
  return (
    <FrontpageMainAreaLayout title="Evaluations">
      {children}
    </FrontpageMainAreaLayout>
  );
}
