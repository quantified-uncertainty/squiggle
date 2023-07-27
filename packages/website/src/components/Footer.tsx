import { FC } from "react";
import { FaGithub, FaDiscord, FaRss } from "react-icons/fa";

const linkClasses = "items-center flex hover:text-gray-900";

export const Footer: FC = () => {
  const externalLinkSection = (
    <div className="flex flex-col space-y-2">
      <a
        href={"https://github.com/quantified-uncertainty/squiggle"}
        className={linkClasses}
      >
        <FaGithub size="1em" className="mr-2" />
        Github
      </a>
      <a href={"https://discord.gg/nsTnQTgtG"} className={linkClasses}>
        <FaDiscord size="1em" className="mr-2" />
        Discord
      </a>
      <a href={"https://quri.substack.com/t/squiggle"} className={linkClasses}>
        <FaRss size="1em" className="mr-2" />
        Newsletter
      </a>
    </div>
  );
  return (
    <div className="flex-1 nx-mx-auto nx-flex">
      <div className="px-4 pb-8">{externalLinkSection}</div>
    </div>
  );
};
