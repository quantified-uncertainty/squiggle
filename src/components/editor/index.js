import "./styles.css";
const embed = require("vega-embed").embed;
const get_pdf_from_user_input = require("./main.js").get_pdf_from_user_input;

let [y, x] = get_pdf_from_user_input("normal(1, 1)  / normal(10, 1)");

let pdf = x.map((val, idx) => ({ x: val, pdf: y[idx] }));

let spec = {
  data: {
    values: pdf
  },
  mark: { type: "area", line: true },
  encoding: {
    x: { field: "x", type: "quantitative" },
    y: {
      field: "pdf",
      type: "quantitative",
      scale: { domain: [0, 3 * Math.max(...y)] }
    }
  },
  width: 500
};

embed("#viz", spec);

console.log(y.reduce((a, b) => a + b));

document.getElementById("app").innerHTML = `
<div id="viz"></div>
`;
