@module("@quri/squiggle-mc/quri_squiggle_mc") external sampleN: (array<float>, int) => array<float> = "sample_n"
let sampleN = sampleN

@module("@quri/squiggle-mc/quri_squiggle_mc") external samplesToContinuousPdf: (array<float>, int) => PointSetTypes.xyShape = "samples_to_continuous_pdf"
let samplesToContinuousPdf = samplesToContinuousPdf
