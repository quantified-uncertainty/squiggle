# TODO: REVIVE PLAYGROUND. 

# Squiggle Playground

This repository contains the squiggle playground, a small web interface
for playing around with squiggle concepts.

It depends on `@quri/squiggle-components` and `@quri/squiggle-lang` so both of them will
need to be packaged for this to work. This can be done from the root directory
with

```
yarn build:lang
yarn build:components
```

Then, starting the playground can be done with:

```
yarn parcel
```
