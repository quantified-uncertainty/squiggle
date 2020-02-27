// The main algorithmic work is done by functions in this module.
// It also contains the main function, taking the user's string
// and returning pdf values and x's.

const distrs = require("./distribution.js").distrs;
const parse = require("./parse.js");
const _math = require("mathjs");
const math = _math.create(_math.all);
const bst = require("binary-search-tree");

const NUM_MC_SAMPLES = 300;
const OUTPUT_GRID_NUMEL = 300;

function evenly_spaced_grid(start, stop, numel) {
  return Array(numel)
    .fill(0)
    .map((_, idx) => start + (idx / numel) * (stop - start));
}

function get_distributions(substrings) {
  // Takes an array of strings like "normal(0, 1)" and
  // returns the corresponding distribution objects
  let names_and_args = substrings.map(parse.get_distr_name_and_args);
  let pdfs = names_and_args.map(x => new distrs[x[0]](x[1]));
  return pdfs;
}

function update_transformed_divider_points_bst(
  transform_func,
  deterministic_pdf,
  mc_distrs,
  track_idx,
  num_mc_samples,
  bst_pts_and_idxs
) {
  // update the binary search tree with bin points of
  // deterministic_pdf transformed by tansform func
  // (transfrom func can be a stocahstic func with parameters
  // sampled from mc_distrs)
  var transformed_pts = [];
  var pdf_inner_idxs = [];
  var factors = [];
  var start_pt = Infinity;
  var end_pt = -Infinity;
  let use_mc = mc_distrs.length > 0;
  var num_outer_iters = use_mc ? num_mc_samples : 1;

  for (let sample_idx = 0; sample_idx < num_outer_iters; ++sample_idx) {
    var this_transformed_pts = deterministic_pdf.divider_pts;
    if (use_mc) {
      let samples = mc_distrs.map(x => x.sample());
      this_transformed_pts = this_transformed_pts.map(x =>
        transform_func([x].concat(samples))
      );
    } else {
      this_transformed_pts = this_transformed_pts.map(x => transform_func([x]));
    }
    var this_transformed_pts_paired = [];
    for (let tp_idx = 0; tp_idx < this_transformed_pts.length - 1; tp_idx++) {
      let sorted = [
        this_transformed_pts[tp_idx],
        this_transformed_pts[tp_idx + 1]
      ].sort((a, b) => a - b);
      if (sorted[0] < start_pt) {
        start_pt = sorted[0];
      }
      if (sorted[1] > end_pt) {
        end_pt = sorted[1];
      }
      this_transformed_pts_paired.push(sorted);
    }

    transformed_pts = transformed_pts.concat(this_transformed_pts_paired);

    pdf_inner_idxs = pdf_inner_idxs.concat([
      ...Array(this_transformed_pts_paired.length).keys()
    ]);
    var this_factors = [];
    for (let idx = 0; idx < this_transformed_pts_paired.length; idx++) {
      this_factors.push(
        (deterministic_pdf.divider_pts[idx + 1] -
          deterministic_pdf.divider_pts[idx]) /
        (this_transformed_pts_paired[idx][1] -
          this_transformed_pts_paired[idx][0])
      );
    }
    factors = factors.concat(this_factors);
  }
  for (let i = 0; i < transformed_pts.length; ++i) {
    bst_pts_and_idxs.insert(transformed_pts[i][0], {
      start: transformed_pts[i][0],
      end: transformed_pts[i][1],
      idx: [track_idx, pdf_inner_idxs[i]],
      factor: factors[i] / num_outer_iters
    });
  }
  return [start_pt, end_pt];
}

function get_final_pdf(pdf_vals, bst_pts_and_idxs, output_grid) {
  // Take the binary search tree with transformed bin points,
  // and an array of pdf values associated with the bins,
  // and return a pdf over an evenly spaced grid
  var offset = output_grid[1] / 2 - output_grid[0] / 2;
  var active_intervals = new Map();
  var active_endpoints = new bst.AVLTree();
  var final_pdf_vals = [];
  for (
    let out_grid_idx = 0;
    out_grid_idx < output_grid.length;
    ++out_grid_idx
  ) {
    let startpoints_within_bin = bst_pts_and_idxs.betweenBounds({
      $gte: output_grid[out_grid_idx] - offset,
      $lt: output_grid[out_grid_idx] + offset
    });
    for (let interval of startpoints_within_bin) {
      active_intervals.set(interval.idx, [
        interval.start,
        interval.end,
        interval.factor
      ]);
      active_endpoints.insert(interval.end, interval.idx);
    }
    var contrib = 0;
    for (let [pdf_idx, bounds_and_ratio] of active_intervals.entries()) {
      let overlap_start = Math.max(
        output_grid[out_grid_idx] - offset,
        bounds_and_ratio[0]
      );
      let overlap_end = Math.min(
        output_grid[out_grid_idx] + offset,
        bounds_and_ratio[1]
      );
      let interval_size = bounds_and_ratio[1] - bounds_and_ratio[0];
      let contrib_frac =
        interval_size === 0
          ? 0
          : (overlap_end - overlap_start) * bounds_and_ratio[2];
      let t = contrib_frac * pdf_vals[pdf_idx[0]][pdf_idx[1]];
      contrib += t;
    }
    final_pdf_vals.push(contrib);
    let endpoints_within_bin = active_endpoints.betweenBounds({
      $gte: output_grid[out_grid_idx] - offset,
      $lt: output_grid[out_grid_idx] + offset
    });
    for (let interval_idx of endpoints_within_bin) {
      active_intervals.delete(interval_idx);
    }
  }
  return final_pdf_vals;
}

function get_pdf_from_user_input(user_input_string) {
  // Entrypoint. Pass user input strings to this function,
  // get the corresponding pdf values and input points back.
  // If the pdf requires monte carlo (it contains a between-distr function)
  // we first determing which distr to have deterministic
  // and whih to sample from. This is decided based on which
  // choice gives the least variance.
  let parsed = parse.parse_initial_string(user_input_string);
  let mm_args = parse.separate_mm_args(parsed.mm_args_string);
  const is_mm = mm_args.distrs.length > 0;
  let tree = new bst.AVLTree();
  let possible_start_pts = [];
  let possible_end_pts = [];
  let all_vals = [];
  let weights = is_mm ? math.compile(mm_args.weights).evaluate()._data : [1];
  let weights_sum = weights.reduce((a, b) => a + b);
  weights = weights.map(x => x / weights_sum);
  let n_iters = is_mm ? mm_args.distrs.length : 1;
  for (let i = 0; i < n_iters; ++i) {
    let distr_string = is_mm ? mm_args.distrs[i] : parsed.outer_string;
    var [deterministic_pdf, mc_distrs] = choose_pdf_func(distr_string);
    var grid_transform = get_grid_transform(distr_string);
    var [start_pt, end_pt] = update_transformed_divider_points_bst(
      grid_transform,
      deterministic_pdf,
      mc_distrs,
      i,
      NUM_MC_SAMPLES,
      tree
    );
    possible_start_pts.push(start_pt);
    possible_end_pts.push(end_pt);
    all_vals.push(deterministic_pdf.pdf_vals.map(x => x * weights[i]));
  }
  start_pt = Math.min(...possible_start_pts);
  end_pt = Math.max(...possible_end_pts);
  let output_grid = evenly_spaced_grid(start_pt, end_pt, OUTPUT_GRID_NUMEL);
  let final_pdf_vals = get_final_pdf(all_vals, tree, output_grid);
  return [final_pdf_vals, output_grid];
}

function variance(vals) {
  var vari = 0;
  for (let i = 0; i < vals[0].length; ++i) {
    let mean = 0;
    let this_vari = 0;
    for (let val of vals) {
      mean += val[i] / vals.length;
    }
    for (let val of vals) {
      this_vari += (val[i] - mean) ** 2;
    }
    vari += this_vari;
  }
  return vari;
}

function pluck_from_array(array, idx) {
  return [array[idx], array.slice(0, idx).concat(array.slice(idx + 1))];
}

function choose_pdf_func(distr_string) {
  // If distr_string requires MC, try all possible
  // choices for the deterministic distribution,
  // and pick the one with the least variance.
  var variances = [];
  let transform_func = get_grid_transform(distr_string);
  let substrings = parse.get_distr_substrings(distr_string);
  var pdfs = get_distributions(substrings);
  if (pdfs.length === 1) {
    return [pdfs[0], []];
  }
  var start_pt = 0;
  var end_pt = 0;
  for (let i = 0; i < pdfs.length; ++i) {
    var outputs = [];
    for (let j = 0; j < 20; ++j) {
      let tree = new bst.AVLTree();
      let [deterministic_pdf, mc_distrs] = pluck_from_array(pdfs, i);
      let [this_start_pt, this_end_pt] = update_transformed_divider_points_bst(
        transform_func,
        deterministic_pdf,
        mc_distrs,
        0,
        10,
        tree
      );
      [start_pt, end_pt] =
        j === 0 ? [this_start_pt, this_end_pt] : [start_pt, end_pt];
      var output_grid = evenly_spaced_grid(start_pt, end_pt, 100);
      let final_pdf_vals = get_final_pdf(
        [deterministic_pdf.pdf_vals],
        tree,
        output_grid
      );
      outputs.push(final_pdf_vals);
    }
    variances.push(variance(outputs));
  }
  let best_variance = Math.min(...variances);
  let best_idx = variances
    .map((val, idx) => [val, idx])
    .filter(x => x[0] === best_variance)[0][1];
  let mc_distrs = pdfs.slice(0, best_idx).concat(pdfs.slice(best_idx + 1));
  return [pdfs[best_idx], mc_distrs];
}

function get_grid_transform(distr_string) {
  let substrings = parse.get_distr_substrings(distr_string);
  let arg_strings = [];
  for (let i = 0; i < substrings.length; ++i) {
    distr_string = distr_string.replace(substrings[i], "x_" + i.toString());
    arg_strings.push("x_" + i.toString());
  }
  let compiled = math.compile(distr_string);

  function grid_transform(x) {
    let kv_pairs = arg_strings.map((val, idx) => [val, x[idx]]);
    let args_obj = Object.fromEntries(new Map(kv_pairs));
    return compiled.evaluate(args_obj);
  }

  return grid_transform;
}

exports.get_pdf_from_user_input = get_pdf_from_user_input;
