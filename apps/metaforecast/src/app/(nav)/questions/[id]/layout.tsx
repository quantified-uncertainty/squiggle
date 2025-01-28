import { PropsWithChildren } from "react";

import { Card } from "@/web/common/Card";

export default function QuestionLayout({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto max-w-4xl">
      <Card highlightOnHover={false} large>
        {children}
      </Card>
    </div>
  );
}
