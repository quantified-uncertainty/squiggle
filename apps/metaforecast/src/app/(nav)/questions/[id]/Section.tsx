import React, { FC, PropsWithChildren } from "react";

export const Section: FC<PropsWithChildren<{ title: string; id?: string }>> = ({
  title,
  children,
  id,
}) => (
  <div className="space-y-4 flex flex-col items-start" id={id}>
    <div className="border-b-2 border-gray-200 w-full group">
      <h2 className="text-xl leading-3 text-gray-900">
        <span>{title}</span>
        {id ? (
          <>
            {" "}
            <a
              className="text-gray-300 no-underline hidden group-hover:inline"
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
