import React from "react";
import clsx from "clsx";
import styles from "./HomepageFeatures.module.css";

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

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
