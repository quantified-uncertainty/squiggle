@@warning("-27")
%%raw(`const Sparklines = require('../../PointSetDist/Sparklines')`)

let create = (relativeHeights: array<float>, ~maximum=?, ()) => {
  %raw(`Sparklines.create(relativeHeights, maximum)`)
}
