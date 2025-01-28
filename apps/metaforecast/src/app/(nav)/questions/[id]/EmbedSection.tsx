"use client";
import { FC } from "react";

import { Collapsible } from "@/web/common/Collapsible";
import { CopyParagraph } from "@/web/common/CopyParagraph";
import { QuestionWithHistoryFragment } from "@/web/fragments.generated";
import { getBasePath } from "@/web/utils";

import { Section } from "./Section";

export const EmbedSection: FC<{ question: QuestionWithHistoryFragment }> = ({
  question,
}) => {
  const url = `${getBasePath()}/questions/embed/${question.id}`;
  return (
    <Section title="Embed" id="embed">
      <CopyParagraph
        text={`<iframe src="${url}" height="600" width="600" frameborder="0" />`}
        buttonText="Copy HTML"
      />
      <div className="mt-2">
        <Collapsible title="Preview">
          {() => <iframe src={url} height="600" width="600" frameBorder="0" />}
        </Collapsible>
      </div>
    </Section>
  );
};
