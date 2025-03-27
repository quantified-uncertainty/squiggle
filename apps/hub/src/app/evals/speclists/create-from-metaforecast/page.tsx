"use client";

import { useRouter } from "next/navigation";

import { Button } from "@quri/ui";

import { Card } from "@/components/ui/Card";
import { H2 } from "@/components/ui/Headers";
import { StyledLink } from "@/components/ui/StyledLink";
import { questionSetsRoute } from "@/lib/routes";

export default function CreateSpecListFromMetaforecastPage() {
  const router = useRouter();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <H2>Create Spec List from Metaforecast (TODO)</H2>
        <StyledLink href={questionSetsRoute()}>← Back to Spec Lists</StyledLink>
      </div>

      <Card theme="big">
        <p className="mb-4">
          This page will show a list of available Metaforecast questions, and
          allow the user to select one or more of them to create a new spec
          list.
        </p>
        <div className="mt-6">
          <Button
            theme="primary"
            onClick={() => router.push(questionSetsRoute())}
          >
            Back to Spec Lists
          </Button>
        </div>
      </Card>
    </div>
  );
}
