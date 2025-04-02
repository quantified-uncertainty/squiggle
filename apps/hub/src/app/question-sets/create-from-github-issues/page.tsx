"use client";

import { useRouter } from "next/navigation";

import { Button } from "@quri/ui";

import { Card } from "@/components/ui/Card";
import { H2 } from "@/components/ui/Headers";
import { StyledLink } from "@/components/ui/StyledLink";
import { questionSetsRoute } from "@/lib/routes";

export default function CreateQuestionSetFromGitHubIssuesPage() {
  const router = useRouter();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <H2>Create Question Set from GitHub Issues (TODO)</H2>
        <StyledLink href={questionSetsRoute()}>
          ← Back to Question Sets
        </StyledLink>
      </div>

      <Card theme="big">
        <p className="mb-4">
          This page will prompt the user to enter a GitHub repository URL, and
          then select one or more issues from the repository to create a new
          question set.
        </p>
        <p className="mb-4">
          It will also contain a textarea that would convert the issues into
          questions, e.g. &quot;Estimate the expected value for this
          issue&quot;.
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
