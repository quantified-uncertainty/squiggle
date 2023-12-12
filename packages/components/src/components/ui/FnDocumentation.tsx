import { clsx } from "clsx";
import React, { FC, PropsWithChildren } from "react";
import ReactMarkdown from "react-markdown";

import { type FnDocumentation as FnDocumentationType } from "@quri/squiggle-lang";

import { SQUIGGLE_DOCS_URL } from "../../lib/constants.js";

const Section: FC<PropsWithChildren> = ({ children }) => (
  <div className={clsx("px-4 py-2")}>{children}</div>
);

export const FnDocumentation: FC<{ documentation: FnDocumentationType }> = ({
  documentation,
}) => {
  const {
    name,
    nameSpace,
    requiresNamespace,
    isUnit,
    shorthand,
    isExperimental,
    description,
    signatures,
    examples,
  } = documentation;
  const fullName = `${nameSpace ? nameSpace + "." : ""}${name}`;
  const tagCss = "text-xs font-medium me-2 px-2.5 py-0.5 rounded";

  return (
    <>
      <Section>
        <div className="flex flex-nowrap items-end justify-between gap-2 py-0.5">
          <a
            href={`${SQUIGGLE_DOCS_URL}/${nameSpace}#${name}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:underline text-sm leading-none"
          >
            {fullName}
          </a>
          <div className="italic text-xs leading-none text-slate-500">
            Stdlib
          </div>
        </div>
      </Section>
      {(isUnit || shorthand || isExperimental || !requiresNamespace) && (
        <Section>
          <div className="flex">
            {isUnit && (
              <div className={clsx("bg-yellow-100 text-yellow-800", tagCss)}>
                Unit
              </div>
            )}
            {shorthand && (
              <div className={clsx("bg-orange-100 text-gray-500", tagCss)}>
                {`${shorthand.type}:  `}
                <span className="font-mono ml-2 text-orange-800">
                  {shorthand.symbol}
                </span>
              </div>
            )}
            {isExperimental && (
              <div className={clsx("bg-red-100 text-red-800", tagCss)}>
                Experimental
              </div>
            )}
            {!requiresNamespace && (
              <div className={clsx("bg-purple-100 text-slate-800", tagCss)}>
                {`Namespace optional`}
              </div>
            )}
          </div>
        </Section>
      )}

      {description ? (
        <Section>
          <ReactMarkdown className="prose text-xs text-slate-600">
            {description}
          </ReactMarkdown>
        </Section>
      ) : null}
      {signatures.length ? (
        <Section>
          <header className="text-xs text-slate-600 font-medium mb-2">
            Signatures
          </header>
          <div className="text-xs text-slate-600 font-mono p-2 bg-slate-100 rounded-md">
            {signatures.map((sig, i) => (
              <div className="pb-1" key={i}>
                {fullName + sig}
              </div>
            ))}
          </div>
        </Section>
      ) : null}
      {examples?.length ? (
        <Section>
          <header className="text-xs text-slate-600 font-medium mb-2">
            Examples
          </header>
          <div className="text-xs text-slate-600 font-mono p-2 bg-slate-100 rounded-md">
            {examples.map((example, i) => (
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
