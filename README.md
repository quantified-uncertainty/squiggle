# WideDomain

This is an experimental library & application for writing estimation functions in ReasonML.

Users would write models with declared interfaces (inputs & outputs). These models can output probability distributions or variables. 

## DistPlus 
We have a custom library called DistPlus to handle distributions with additional metadata. This helps handle mixed distributions (continuous + discrete), a cache for a cdf, possible unit types (specific times are supported), and limited domains.

## Running

Currently it only has a few very simple models.

```
yarn
yarn run start
yarn run parcel
```

## Current Setup
You can see a current version of this running online here:
https://www.highlyspeculativeestimates.com/m/ea-funds
