import { Guesstimator } from '@foretold/guesstimator';
import { Samples } from '@foretold/cdf';

const toPdf = (values, min, max) => {
  const samples = new Samples(values);

  const ratioSize$ = ratioSize(samples);
  const width = ratioSize$ === 'SMALL' ? 20 : 1;

  const pdf = samples.toPdf({ size: 1000, width, min, max });
  return {ys:pdf.ys, xs:pdf.xs};
};

let run = (text, sampleCount, inputs=[], min=false, max=false) => {
    let [_error, item] = Guesstimator.parse({ text });
    const { parsedInput } = item;
    const { guesstimateType } = parsedInput;

    const guesstimator = new Guesstimator({ parsedInput });
    const value = guesstimator.sample(
      sampleCount,
      inputs,
    );
    const samplerType = guesstimator.samplerType();

    const values = _.filter(value.values, _.isFinite);

    this.setState({
      value: event.target.value,
      items: values,
    });

    let update;
    if (values.length === 0) {
      update = {xs: [], ys: []};
    } else if (values.length === 1) {
      update = {xs: [], ys: []};
    } else {
      update = toPdf(values, min, max);
    }
    return update;
}

module.exports = {
  run,
};