"use client";

import { useRouter } from "next/navigation";

import { Button } from "@quri/ui";

import { Card } from "@/components/ui/Card";
import { H2 } from "@/components/ui/Headers";
import { StyledLink } from "@/components/ui/StyledLink";
import { questionSetsRoute } from "@/lib/routes";

export default function CreateQuestionSetFromMetaforecastPage() {
  const router = useRouter();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <H2>Create Question Set from Metaforecast (TODO)</H2>
        <StyledLink href={questionSetsRoute()}>
          ← Back to Question Sets
        </StyledLink>
      </div>

      <Card theme="big">
        <p className="mb-4">
          This page will show a list of available Metaforecast questions, and
          allow the user to select one or more of them to create a new question
          set.
        </p>
        <div className="mt-6">
          <Button
            theme="primary"
            onClick={() => router.push(questionSetsRoute())}
          >
            Back to Question Sets
          </Button>
        </div>
      </Card>
    </div>
  );
}
