import type { Metadata } from "next";
import { FC } from "react";

import { HomepageFeatures } from "../../components/HomepageFeatures";

const HomepageHeader: FC = () => {
  return (
    <header className="bg-[#fff6ed] p-8">
      <div className="flex flex-col items-center">
        {/* TODO: next/image */}
        <img alt="Squiggle logo" src="/img/squiggle-logo.png" width={70} />
        <h1 className="font-lato text-[4rem] font-black text-[#e6484f]">
          Squiggle
        </h1>
        <h2 className="text-xl font-semibold text-stone-400">Beta</h2>
        <p className="font-lora my-4 max-w-md text-center text-2xl font-semibold leading-relaxed text-stone-500">
          A simple programming language for intuitive probabilistic estimation
        </p>
      </div>
    </header>
  );
};

export default function HomePage() {
  return (
    <div>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </div>
  );
}

export const metadata: Metadata = {
  description:
    "A simple programming language for intuitive probabilistic estimation",
};
