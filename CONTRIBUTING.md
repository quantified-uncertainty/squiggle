_The current document was written quickly and not exhaustively, yet, it's unfinished. [Template here](https://mozillascience.github.io/working-open-workshop/contributing/)_

# Contributing to Squiggle

We welcome contributions from developers, especially people in react/typescript, rescript, and interpreters/parsers. We also are keen to hear issues filed by users! 

Squiggle is currently pre-alpha. 

# Quick links

- [Roadmap to the alpha](https://github.com/QURIresearch/squiggle/projects/2)
- The team presently communicates via the **EA Forecasting and Epistemics** slack (channels `#squiggle` and `#squiggle-ops`), you can track down an invite by reaching out to Ozzie Gooen
- [Squiggle documentation](https://www.squiggle-language.com/docs/Language)
- [Rescript documentation](https://rescript-lang.org/docs/manual/latest/introduction)
- You can email `quinn@quantifieduncertainty.org` if you need assistance in onboarding or if you have questions 

# Bug reports

Anyone (with a github account) can file an issue at any time. Please allow Quinn, Sam, and Ozzie to triage, but we encourage you to use either the `Bug` or `Enhancement` labels depending on the nature of the issue you're filing. `

# Project structure

Squiggle is a **monorepo** with four **packages**. 
- **components** is where we improve reactive interfacing with Squiggle
- **playground** is the site `playground.squiggle-language.com`
- **squiggle-lang** is where the magic happens: probability distributions, the interpreter, etc. 
- **website** is the site `squiggle-language.com`

# Deployment ops

We use netlify, and it should only concern Quinn, Sam, and Ozzie. 

# Development environment, building, testing, dev server

You need `yarn`. 

TODO: fill this out based on all the different packages scripts once they cool down. 

# Pull request protocol

Please work against `staging` branch. **Do not** work against `master`. Please do not merge without approval from some subset of Quinn, Sam, and Ozzie; they will be auto-pinged. 

