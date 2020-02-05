'use strict';

var Block = require("bs-platform/lib/js/block.js");

function foo(joint) {
  return [
          {
            statements: [
              {
                statement: /* Senate */Block.__(0, [/* DEMOCRAT_VICTORY */0]),
                outcome: /* Bool */Block.__(0, [true])
              },
              {
                statement: /* House */Block.__(1, [/* DEMOCRAT_VICTORY */0]),
                outcome: /* Bool */Block.__(0, [true])
              }
            ],
            probability: 0.2
          },
          {
            statements: [
              {
                statement: /* Senate */Block.__(0, [/* DEMOCRAT_VICTORY */0]),
                outcome: /* Bool */Block.__(0, [true])
              },
              {
                statement: /* House */Block.__(1, [/* DEMOCRAT_VICTORY */0]),
                outcome: /* Bool */Block.__(0, [false])
              }
            ],
            probability: 0.2
          },
          {
            statements: [
              {
                statement: /* Senate */Block.__(0, [/* DEMOCRAT_VICTORY */0]),
                outcome: /* Bool */Block.__(0, [false])
              },
              {
                statement: /* House */Block.__(1, [/* DEMOCRAT_VICTORY */0]),
                outcome: /* Bool */Block.__(0, [true])
              }
            ],
            probability: 0.5
          },
          {
            statements: [
              {
                statement: /* Senate */Block.__(0, [/* DEMOCRAT_VICTORY */0]),
                outcome: /* Bool */Block.__(0, [false])
              },
              {
                statement: /* House */Block.__(1, [/* DEMOCRAT_VICTORY */0]),
                outcome: /* Bool */Block.__(0, [false])
              }
            ],
            probability: 0.1
          }
        ];
}

exports.foo = foo;
/* No side effect */
