%%raw(`const Env = require('../../Dist/env')`)

@genType
type env = {
  sampleCount: int,
  xyPointLength: int,
}

let defaultEnv: env = %raw(`Env.defaultEnv`)
