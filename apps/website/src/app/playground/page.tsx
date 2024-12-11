import { Suspense } from "react";

import { ClientPlayground } from "./ClientPlayground";

export default function PlaygroundPage() {
  return (
    // ClientPlayground uses `useSearchParams`, so suspense is necessary in Next v15;
    // see https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
    <Suspense fallback={null}>
      <ClientPlayground />
    </Suspense>
  );
}

export const metadata = {
  title: "Squiggle Playground",
};
