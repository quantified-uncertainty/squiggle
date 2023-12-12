import { clsx } from "clsx";
import React, { FC, PropsWithChildren } from "react";
import ReactMarkdown from "react-markdown";

import {
  FnDefinition,
  type FnDocumentation as FnDocumentationType,
} from "@quri/squiggle-lang";

import { SQUIGGLE_DOCS_URL } from "../../lib/constants.js";

const Section: FC<PropsWithChildren> = ({ children }) => (
  <div className={clsx("px-4 py-2")}>{children}</div>
);

//I'm not sure if this is worth it here. Much of the input data is hidden from us at this point. It might be better to just go back to strings, or to formally parse it after having it as a string.
const StyleDefinition: FC<{ fullName: string; def: FnDefinition }> = ({
  fullName,
  def,
}) => {
  const isOptional = (t) => (t.isOptional === undefined ? false : t.isOptional);
  const annotation = "text-slate-400";
  const primary = "text-slate-900";
  const inputs = def.inputs.map((t, index) => (
    <span key={index}>
      <span className={primary}>{t.getName()}</span>
      {isOptional(t) ? <span className={primary}>?</span> : ""}
      {index !== def.inputs.length - 1 && (
        <span className={annotation}>, </span>
      )}
    </span>
  ));
  const output = def.output.getName();
  return (
    <div>
      <span className="text-slate-500">{fullName}</span>
      <span className={annotation}>(</span>
      <span className={clsx(primary, "ml-0.5 mr-0.5")}>{inputs}</span>
      <span className={annotation}>)</span>
      {output ? (
        <>
          <span className={annotation}>{" => "}</span>{" "}
          <span className={primary}>{output}</span>
        </>
      ) : (
        ""
      )}
    </div>
  );
};

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
    definitions,
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
      {definitions ? (
        <Section>
          <header className="text-xs text-slate-600 font-medium mb-2">
            Signatures
          </header>
          <div className="text-xs text-slate-600 font-mono p-2 bg-slate-100 rounded-md space-y-2">
            {definitions.map((def, id) => (
              <StyleDefinition fullName={fullName} def={def} key={id} />
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
