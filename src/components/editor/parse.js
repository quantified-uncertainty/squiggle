const _math = require("mathjs");
const math = _math.create(_math.all);

// Functions for parsing/processing user input strings are here

// @todo: Do not use objects.
const DISTR_REGEXS = [
  /beta\(/g,
  /(log)?normal\(/g,
  /multimodal\(/g,
  /mm\(/g,
  /uniform\(/g
];

/**
 * @param user_input_string
 * @returns {{mm_args_string: string, outer_string: string}}
 */
function parse_initial_string(user_input_string) {
  let outer_output_string = "";
  let mm_args_string = "";
  let idx = 0;

  while (idx < user_input_string.length) {
    if (
      user_input_string.substring(idx - 11, idx) === "multimodal(" ||
      user_input_string.substring(idx - 3, idx) === "mm("
    ) {
      let num_open_brackets = 1;
      while (num_open_brackets > 0 && idx < user_input_string.length) {
        mm_args_string += user_input_string[idx];
        idx += 1;
        if (user_input_string[idx] === ")") {
          num_open_brackets -= 1;
        } else if (user_input_string[idx] === "(") {
          num_open_brackets += 1;
        }
      }
      outer_output_string += ")";
      idx += 1;
    } else {
      outer_output_string += user_input_string[idx];
      idx += 1;
    }
  }

  return {
    outer_string: outer_output_string,
    mm_args_string: mm_args_string
  };
}

/**
 * @param mm_args_string
 * @returns {{distrs: [], weights: string}}
 */
function separate_mm_args(mm_args_string) {
  if (mm_args_string.endsWith(",")) {
    mm_args_string = mm_args_string.slice(0, -1);
  }
  let args_array = [];
  let num_open_brackets = 0;
  let arg_substring = "";
  for (let char of mm_args_string) {
    if (num_open_brackets === 0 && char === ",") {
      args_array.push(arg_substring.trim());
      arg_substring = "";
    } else {
      if (char === ")" || char === "]") {
        num_open_brackets -= 1;
      } else if (char === "(" || char === "[") {
        num_open_brackets += 1;
      }
      arg_substring += char;
    }
  }
  return {
    distrs: args_array,
    weights: arg_substring.trim()
  };
}

/**
 * @param distr_string
 * @returns {[]}
 */
function get_distr_substrings(distr_string) {
  let substrings = [];
  for (let regex of DISTR_REGEXS) {
    let matches = distr_string.matchAll(regex);
    for (let match of matches) {
      let idx = match.index + match[0].length;
      let num_open_brackets = 1;
      let distr_substring = "";
      while (num_open_brackets !== 0 && idx < distr_string.length) {
        distr_substring += distr_string[idx];
        if (distr_string[idx] === "(") {
          num_open_brackets += 1;
        } else if (distr_string[idx] === ")") {
          num_open_brackets -= 1;
        }
        idx += 1;
      }
      substrings.push((match[0] + distr_substring).trim());
    }
  }

  return substrings;
}

/**
 * @param substr
 * @returns {(string|*)[]}
 */
function get_distr_name_and_args(substr) {
  let distr_name = "";
  let args_str = "";
  let args_flag = false;
  for (let char of substr) {
    if (!args_flag && char !== "(") {
      distr_name += char;
    }
    if (args_flag && char !== ")") {
      args_str += char;
    }
    if (char === "(") {
      args_str += "[";
      args_flag = true;
    }
  }
  args_str += "]";
  let args = math.compile(args_str).evaluate()._data;
  return [distr_name, args];
}

exports.get_distr_name_and_args = get_distr_name_and_args;
exports.get_distr_substrings = get_distr_substrings;
exports.separate_mm_args = separate_mm_args;
exports.parse_initial_string = parse_initial_string;
