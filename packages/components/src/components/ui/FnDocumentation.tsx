import React from "react";
import ReactMarkdown from "react-markdown";
import { clsx } from "clsx";
import { SQUIGGLE_DOCS_URL } from "../../lib/constants.js";
import { FC, PropsWithChildren } from "react";
import { type FnDocumentation as FnDocumentationType } from "@quri/squiggle-lang";

const Section: FC<PropsWithChildren<{ last?: boolean }>> = ({
  children,
  last,
}) => <div className={clsx("px-4 py-2", last || "")}>{children}</div>;

export const FnDocumentation: FC<{ documentation: FnDocumentationType }> = ({
  documentation,
}) => {
  const fullName = `${
    documentation.nameSpace ? documentation.nameSpace + "." : ""
  }${documentation.name}`;

  return (
    <>
      <Section>
        <div className="flex flex-nowrap items-end justify-between gap-2 py-0.5">
          <a
            href={`${SQUIGGLE_DOCS_URL}/${documentation.nameSpace}#${documentation.name}`}
            className="text-blue-500 hover:underline text-sm leading-none"
          >
            {fullName}
          </a>
          <div className="italic text-xs leading-none text-slate-500">
            Stdlib
          </div>
        </div>
      </Section>
      {documentation.description ? (
        <Section>
          <ReactMarkdown className="prose text-xs text-slate-600">
            {documentation.description}
          </ReactMarkdown>
        </Section>
      ) : null}
      {documentation.signatures.length ? (
        <Section>
          <header className="text-xs text-slate-600 font-medium mb-2">
            Signatures
          </header>
          <div className="text-xs text-slate-600 font-mono p-2 bg-slate-100 rounded-md">
            {documentation.signatures.map((sig, i) => (
              <div className="pb-1" key={i}>
                {fullName + sig}
              </div>
            ))}
          </div>
        </Section>
      ) : null}
      {documentation.examples?.length ? (
        <Section>
          <header className="text-xs text-slate-600 font-medium mb-2">
            Examples
          </header>
          <div className="text-xs text-slate-600 font-mono p-2 bg-slate-100 rounded-md">
            {documentation.examples.map((example, i) => (
              <div className="p-1" key={i}>
                {example}
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
};
