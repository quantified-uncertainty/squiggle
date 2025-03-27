import { PropsWithChildren } from "react";

import { FrontpageMainAreaLayout } from "../FrontpageMainAreaLayout";

export default function VariablesLayout({ children }: PropsWithChildren) {
  return (
    <FrontpageMainAreaLayout title="Variables">
      {children}
    </FrontpageMainAreaLayout>
  );
}
