import React, { FC, PropsWithChildren } from "react";

export const Section: FC<PropsWithChildren<{ title: string; id?: string }>> = ({
  title,
  children,
  id,
}) => (
  <div className="flex flex-col items-start space-y-4" id={id}>
    <div className="group w-full border-b-2 border-gray-200">
      <h2 className="text-xl leading-3 text-gray-900">
        <span>{title}</span>
        {id ? (
          <>
            {" "}
            <a
              className="hidden text-gray-300 no-underline group-hover:inline"
              href={`#${id}`}
            >
              #
            </a>
          </>
        ) : null}
      </h2>
    </div>
    <div>{children}</div>
  </div>
);
