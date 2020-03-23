// This example demonstrates importing a custom data type,
// and extending an existing function (add) with support for this data type.

const { create, factory, all } = require('mathjs');
const math = create(all)

// factory function which defines a new data type FunctionalDistribution
const createFunctionalDistribution = factory('FunctionalDistribution', ['typed'], ({ typed }) => {
  // create a new data type
  function FunctionalDistribution (value) {
    this.value = value
  }
  FunctionalDistribution.prototype.isFunctionalDistribution = true
  FunctionalDistribution.prototype.toString = function () {
    return 'FunctionalDistribution:' + this.value
  }

  // define a new data type with typed-function
  typed.addType({
    name: 'FunctionalDistribution',
    test: function (x) {
      // test whether x is of type FunctionalDistribution
      return x && x.isFunctionalDistribution === true
    }
  })

  return FunctionalDistribution
})

// function add which can add the FunctionalDistribution data type
// When imported in math.js, the existing function `add` with support for
// FunctionalDistribution, because both implementations are typed-functions and do not
// have conflicting signatures.
const createAddFunctionalDistribution = factory('add', ['typed', 'FunctionalDistribution'], ({ typed, FunctionalDistribution }) => {
  return typed('add', {
    'FunctionalDistribution, FunctionalDistribution': function (a, b) {
      return new FunctionalDistribution(a.value + b.value)
    }
  })
})

const createSubtractFunctionalDistribution = factory('subtract', ['typed', 'FunctionalDistribution'], ({ typed, FunctionalDistribution }) => {
  return typed('subtract', {
    'FunctionalDistribution, FunctionalDistribution': function (a, b) {
      return new FunctionalDistribution(a.value - b.value)
    }
  })
})

// import the new data type and function
math.import([
  createFunctionalDistribution,
  createAddFunctionalDistribution,
  createSubtractFunctionalDistribution
])

// use the new type
const ans = math.chain(new math.FunctionalDistribution(2)).subtract(new math.FunctionalDistribution(3))
// ans = FunctionalDistribution(5)

console.log(ans.toString())
// outputs 'FunctionalDistribution:5'

module.exports = ans
