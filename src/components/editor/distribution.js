// This module defines an abstract BinnedDistribution class, which
// should be implemented for each distribution. You need to decide
// how to bin the distribution (use _adabin unless there's a nicer
// way for your distr) and how to choose the distribution's support.
const _math = require("mathjs");
const math = _math.create(_math.all);
const jStat = require("jstat");

math.import({
  normal: jStat.normal,
  beta: jStat.beta,
  lognormal: jStat.lognormal,
  uniform: jStat.uniform
});

class BaseDistributionBinned {
  constructor(args) {
    this._set_props();
    this.max_bin_size = 0.5;
    this.min_bin_size = 0;
    this.increment = 0.001;
    this.desired_delta = 0.01;
    this.start_bin_size = 0.01;

    [this.params, this.pdf_func, this.sample] = this.get_params_and_pdf_func(
      args
    );

    [this.start_point, this.end_point] = this.get_bounds();
    [this.pdf_vals, this.divider_pts] = this.bin();
  }

  _set_props() {
    // this is hacky but class properties aren't always supported
    throw new Error("NotImplementedError");
  }

  _adabin() {
    let point = this.start_point;
    let vals = [this.pdf_func(point)];
    let divider_pts = [point];
    let support = this.end_point - this.start_point;
    let bin_size = this.start_bin_size * support;

    while (point < this.end_point) {
      let val = this.pdf_func(point + bin_size);
      if (Math.abs(val - vals[vals.length - 1]) > this.desired_delta) {
        while (
          (Math.abs(val - vals[vals.length - 1]) > this.desired_delta) &
          (bin_size - this.increment * support > this.min_bin_size)
          ) {
          bin_size -= this.increment;
          val = this.pdf_func(point + bin_size);
        }
      } else if (Math.abs(val - vals[vals.length - 1]) < this.desired_delta) {
        while (
          (Math.abs(val - vals[vals.length - 1]) < this.desired_delta) &
          (bin_size < this.max_bin_size)
          ) {
          bin_size += this.increment;
          val = this.pdf_func(point + bin_size);
        }
      }
      point += bin_size;
      vals.push(val);
      divider_pts.push(point);
    }
    vals = vals.map((_, idx) => vals[idx] / 2 + vals[idx + 1] / 2);
    vals = vals.slice(0, -1);
    return [vals, divider_pts];
  }

  bin() {
    throw new Error("NotImplementedError");
  }

  get_bounds() {
    throw new Error("NotImplementedError");
  }

  get_params_and_pdf_func(args) {
    let args_str = args.toString() + ")";
    let substr = this.name + ".pdf(x, " + args_str;
    let compiled = math.compile(substr);

    function pdf_func(x) {
      return compiled.evaluate({ x: x });
    }

    let mc_compiled = math.compile(this.name + ".sample(" + args_str);
    let kv_pairs = this.param_names.map((val, idx) => [val, args[idx]]);
    let params = Object.fromEntries(new Map(kv_pairs));
    return [params, pdf_func, mc_compiled.evaluate];
  }
}

class NormalDistributionBinned extends BaseDistributionBinned {
  _set_props() {
    this.name = "normal";
    this.param_names = ["mean", "std"];
  }

  get_bounds() {
    return [
      this.params.mean - 4 * this.params.std,
      this.params.mean + 4 * this.params.std
    ];
  }

  bin() {
    return this._adabin(this.params.std);
  }
}

class UniformDistributionBinned extends BaseDistributionBinned {
  _set_props() {
    this.name = "uniform";
    this.param_names = ["start_point", "end_point"];
    this.num_bins = 200;
  }

  get_bounds() {
    return [this.params.start_point, this.params.end_point];
  }

  bin() {
    let divider_pts = evenly_spaced_grid(
      this.params.start_point,
      this.params.end_point,
      this.num_bins
    );
    let vals = divider_pts.map(x =>
      this.pdf_func(this.params.start_point / 2 + this.params.end_point / 2)
    );
    vals = vals.slice(0, -1);
    return [vals, divider_pts];
  }
}

class LogNormalDistributionBinned extends BaseDistributionBinned {
  _set_props() {
    this.name = "lognormal";
    this.param_names = ["normal_mean", "normal_std"];
    this.n_bounds_samples = 1000;
    this.n_largest_bound_sample = 10;
  }

  _nth_largest(samples, n) {
    var largest_buffer = Array(n).fill(-Infinity);
    for (const sample of samples) {
      if (sample > largest_buffer[n - 1]) {
        var i = n;
        while ((i > 0) & (sample > largest_buffer[i - 1])) {
          i -= 1;
        }
        largest_buffer[i] = sample;
      }
    }
    return largest_buffer[n - 1];
  }

  get_bounds() {
    let samples = Array(this.n_bounds_samples)
      .fill(0)
      .map(() => this.sample());
    return [
      math.min(samples),
      this._nth_largest(samples, this.n_largest_bound_sample)
    ];
  }

  bin() {
    return this._adabin();
  }
}

function evenly_spaced_grid(start, stop, numel) {
  return Array(numel)
    .fill(0)
    .map((_, idx) => start + (idx / numel) * (stop - start));
}

const distrs = {
  normal: NormalDistributionBinned,
  lognormal: LogNormalDistributionBinned,
  uniform: UniformDistributionBinned
};

exports.distrs = distrs;
