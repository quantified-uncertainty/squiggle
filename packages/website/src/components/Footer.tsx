import { FC } from "react";

export const Footer: FC = () => {
  return (
    <div className="flex-1">
      <div className="px-4 pb-8">
        <div className="pb-4 font-bold">More</div>
        <ul className="flex flex-col gap-2">
          <li>
            <a href="https://quri.substack.com/t/squiggle">Blog</a>
          </li>
          <li>
            <a href="https://github.com/quantified-uncertainty/squiggle">
              GitHub
            </a>
          </li>
        </ul>
      </div>
      <div className="text-center">
        CC0. Built with{" "}
        <a href="https://nextra.site" target="_blank">
          Nextra
        </a>
        .
      </div>
    </div>
  );
};
