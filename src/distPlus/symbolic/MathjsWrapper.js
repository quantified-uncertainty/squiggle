
const math = require("mathjs");

function parseMath(f){ return JSON.parse(JSON.stringify(math.parse(f))) };

module.exports = {
  parseMath,
};
