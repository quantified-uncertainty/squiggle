import React, { FC, ReactNode } from "react";

const FeatureList = [
  {
    title: "Probabilistic",
    description: (
      <>Squiggle makes working with probability distributions really easy.</>
    ),
  },
  {
    title: "Portable",
    description: (
      <>
        Squiggle is in a small Rescript / Javascript library. It can be used
        wherever Rescript and Javascript are available.
      </>
    ),
  },
  {
    title: "Fast",
    description: (
      <>
        Squiggle tries to get as far as it can without resorting to Monte Carlo
        simulation, but does so when necessary.
      </>
    ),
  },
];

const Feature: FC<{ title: string; description: ReactNode }> = ({
  title,
  description,
}) => {
  return (
    <div className="text-center">
      <h3 className="font-lora pb-4 text-2xl font-bold">{title}</h3>
      <p>{description}</p>
    </div>
  );
};

export const HomepageFeatures: FC = () => {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-8 lg:grid-cols-3">
      {FeatureList.map((props, idx) => (
        <Feature key={idx} {...props} />
      ))}
    </section>
  );
};
