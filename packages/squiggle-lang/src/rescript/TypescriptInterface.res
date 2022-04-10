/*
This is meant as a file to contain @genType declarations as needed for Typescript.
I would ultimately want to have all @genType declarations here, vs. other files, but
@genType doesn't play as nicely with renaming Modules and functions as
would be preferable. 

The below few seem to work fine. In the future there's definitely more work to do here.
*/

@genType
type env = DistributionOperation.env

@genType
type genericDist = GenericDist_Types.genericDist

@genType
type error = GenericDist_Types.error

@genType
type resultDist = result<genericDist, error>
@genType
type resultFloat = result<float, error>
@genType
type resultString = result<string, error>

@genType
let makeSampleSetDist = SampleSetDist.make