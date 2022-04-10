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

Anyone (with a github account) can file an issue at any time. Please allow Quinn, Sam, and Ozzie to triage, but otherwise just follow the suggestions in the issue templates. 

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

Being a monorepo, where packages are connected by dependency, it's important to follow `README.md`s closely. Each package has it's own `README.md`, which is where the bulk of information is. 

We aspire for `ci.yaml` and `README.md`s to be in one-to-one correspondence. 

## If you're on NixOS

You'll need to run a command like this in order to get `yarn build` to run, especially in `packages/squiggle-lang`. 
```sh
patchelf --set-interpreter $(patchelf --print-interpreter $(which mkdir)) ./node_modules/gentype/gentype.exe 
```

See [here](https://github.com/NixOS/nixpkgs/issues/107375)

# Pull request protocol

Please work against `staging` branch. **Do not** work against `master`. Please do not merge without approval from some subset of Quinn, Sam, and Ozzie; they will be auto-pinged. 
