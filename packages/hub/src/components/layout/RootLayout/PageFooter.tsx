"use client";
import { FC } from "react";
import { FaGithub, FaDiscord, FaRss } from "react-icons/fa";
import Image from "next/image";
import logoPic from "@/public/logo.png";
import Link from "next/link";

export const PageFooter: FC = () => (
  <div className="px-8 py-4 border-t border-t-slate-200 bg-slate-100">
    <div className="text-sm text-slate-400 flex justify-between max-w-4xl mx-auto">
      <div className="flex items-center gap-x-5">
        <Image
          src={logoPic} // Route of the image file
          width={40}
          height={40}
          alt="Description for the image"
          className="flex opacity-50"
        />
        <div className="flex-1">
          <span className="block text-slate-400">Made by</span>
          <a
            href="https://quantifieduncertainty.org"
            className="text-slate-500 hover:underline flex-1"
          >
            The Quantified Uncertainty Research Intitute
          </a>
        </div>
      </div>
      <div className="flex flex-col space-y-2 text-sm">
        <Link href="/privacy" className="items-center flex hover:text-gray-900">
          Privacy Policy
        </Link>
        <Link href="/tos" className="items-center flex hover:text-gray-900">
          Terms
        </Link>
        <a
          href="https://quantifieduncertainty.org/donate"
          className="items-center flex hover:text-gray-900"
        >
          Donate
        </a>
      </div>
      <div className="flex flex-col space-y-2 text-sm">
        <a
          href="https://github.com/quantified-uncertainty/squiggle"
          className="items-center flex hover:text-gray-900"
        >
          <FaGithub size="1.2em" className="mr-2" />
          Github
        </a>
        <a
          href="https://discord.gg/nsTnQTgtG6"
          className="items-center flex hover:text-gray-900"
        >
          <FaDiscord size="1.2em" className="mr-2" />
          Discord
        </a>
        <a
          href="https://quri.substack.com/t/squiggle"
          className="items-center flex hover:text-gray-900"
        >
          <FaRss size="1.2em" className="mr-2" />
          Newsletter
        </a>
      </div>
    </div>
  </div>
);
