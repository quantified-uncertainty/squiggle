import Image from "next/image";
import { FC } from "react";
import { FaDiscord, FaGithub, FaRss } from "react-icons/fa";

import { Link } from "@/components/ui/Link";
import {
  DISCORD_URL,
  GITHUB_URL,
  NEWSLETTER_URL,
  QURI_DONATE_URL,
} from "@/lib/constants";
import {
  aboutRoute,
  privacyPolicyRoute,
  termsOfServiceRoute,
} from "@/lib/routes";
import logoPic from "@/public/logo.png";

const linkClasses = "items-center flex hover:text-gray-900";

export const SiteFooter: FC = () => {
  const logoSection = (
    <div className="flex h-16 items-center gap-x-5">
      <Image
        src={logoPic}
        width={40}
        height={40}
        alt="QURI Logo"
        className="flex opacity-50"
      />
      <div className="flex-1">
        <span className="block text-slate-400">Made by</span>
        <a
          href="https://quantifieduncertainty.org"
          className="text-slate-500 hover:underline"
        >
          The Quantified Uncertainty Research Intitute
        </a>
      </div>
    </div>
  );

  const internalLinkSection = (
    <div className="flex flex-col space-y-2">
      <Link href={aboutRoute()} className={linkClasses}>
        About
      </Link>
      <Link href={privacyPolicyRoute()} className={linkClasses}>
        Privacy Policy
      </Link>
      <Link href={termsOfServiceRoute()} className={linkClasses}>
        Terms
      </Link>
      <a href={QURI_DONATE_URL} className={linkClasses}>
        Donate
      </a>
    </div>
  );

  const externalLinkSection = (
    <div className="flex flex-col space-y-2">
      <a href={GITHUB_URL} className={linkClasses}>
        <FaGithub size="1em" className="mr-2" />
        Github
      </a>
      <a href={DISCORD_URL} className={linkClasses}>
        <FaDiscord size="1em" className="mr-2" />
        Discord
      </a>
      <a href={NEWSLETTER_URL} className={linkClasses}>
        <FaRss size="1em" className="mr-2" />
        Newsletter
      </a>
    </div>
  );

  return (
    <div className="border-t border-t-slate-200 bg-slate-100 px-8 py-4">
      <div className="mx-auto flex max-w-4xl flex-col justify-between gap-4 text-sm text-slate-400 sm:flex-row">
        {logoSection}
        {internalLinkSection}
        {externalLinkSection}
      </div>
    </div>
  );
};
