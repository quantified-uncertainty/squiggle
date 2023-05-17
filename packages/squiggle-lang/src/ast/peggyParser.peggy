// Documentation: https://peggyjs.org/documentation.html

{{
  import * as h from './peggyHelpers.js';
}}

start
  = _nl start:outerBlock _nl finalComment?  {return start}

zeroOMoreArgumentsBlockOrExpression = lambda / innerBlockOrExpression

outerBlock
  = imports:importStatementsList
    statements:statementsList
    finalExpression:(statementSeparator @expression)?
    {
      if (finalExpression) {
        statements.push(finalExpression);
      }
      return h.nodeProgram(imports, statements, location());
    }
  / imports:importStatementsList
    finalExpression:expression
    { return h.nodeProgram(imports, [finalExpression], location()); }

importStatementsList = (@importStatement __nl)*

importStatement
  = _nl 'import' __ file:string variable:(__ 'as' __ @identifier)
  { return [variable, file]; }

innerBlockOrExpression
  = quotedInnerBlock
  / finalExpression:expression
    { return h.nodeBlock([finalExpression], location()); }

quotedInnerBlock
  = '{' _nl
    statements:statementsList
    finalExpression:(statementSeparator @expression) _nl
    '}'
    {
      if (finalExpression) {
        statements.push(finalExpression);
      }
      return h.nodeBlock(statements, location());
    }
  / '{' _nl
    finalExpression:expression _nl
    '}'
    { return h.nodeBlock([finalExpression], location()); }

statementsList = statement|1.., statementSeparator|

statement
  = letStatement
  / defunStatement
  / voidStatement

voidStatement
  = "call" _nl value:zeroOMoreArgumentsBlockOrExpression
    {
      const variable = h.nodeIdentifier("_", location());
      return h.nodeLetStatement(variable, value, location());
    }

letStatement
  = variable:variable _ assignmentOp _nl value:zeroOMoreArgumentsBlockOrExpression
    { return h.nodeLetStatement(variable, value, location()); }

defunStatement
  = variable:variable '(' _nl args:functionParameters _nl ')' _ assignmentOp _nl body:innerBlockOrExpression
    {
      const value = h.nodeLambda(args, body, location(), variable);
      return h.nodeDefunStatement(variable, value, location());
    }

  assignmentOp "assignment" = '='

functionParameters = dollarIdentifier|.., commaSeparator|

/*
Rules for expressions start here.

Peggy doesn't have built-in support for operator precedence, so we have to recurse into expressions,
starting from the lowest precedence rules (ternary operators), up to highest precedence rules
(function calls and field lookups), until we bottom down at atoms and start all over again.
*/

expression = ifthenelse / ternary / logicalOr

// Ternaries

ifthenelse
  = 'if' __nl condition:logicalOr
    __nl 'then' __nl trueExpression:innerBlockOrExpression
    __nl 'else' __nl falseExpression:(ifthenelse/innerBlockOrExpression)
    { return h.nodeTernary(condition, trueExpression, falseExpression, 'IfThenElse', location()); }

ternary
  = condition:logicalOr _ '?' _nl trueExpression:logicalOr _ ':' _nl falseExpression:(ternary / logicalOr)
    { return h.nodeTernary(condition, trueExpression, falseExpression, 'C', location()); }

// Binary operators

logicalOr
  = head:logicalAnd tail:(_ @logicalOrOp _nl @logicalAnd)*
  { return h.makeInfixChain(head, tail, location()); }
  logicalOrOp "operator" = '||'

logicalAnd
  = head:equality tail:(_ @logicalAndOp _nl @equality)*
  { return h.makeInfixChain(head, tail, location()); }
  logicalAndOp "operator" = '&&'

equality
  = left:relational _ operator:equalityOp _nl right:relational
  { return h.nodeInfixCall(operator, left, right, location()); }
  / relational

  equalityOp "operator" = '==' / '!='

relational
  = left:credibleInterval _ operator:relationalOp _nl right:credibleInterval
  { return h.nodeInfixCall(operator, left, right, location()); }
  / credibleInterval

  relationalOp "operator" = '<=' / '<' / '>=' / '>'

credibleInterval
  = head:additive tail:(__ @credibleIntervalOp __nl @additive)*
  { return h.makeInfixChain(head, tail, location()); }
  credibleIntervalOp "operator" = 'to'

additive
  = head:multiplicative tail:(_ @additiveOp _nl @multiplicative)*
  { return h.makeInfixChain(head, tail, location()); }
  additiveOp "operator" = '+' / '-' / '.+' / '.-'

multiplicative
  = head:power tail:(_ @multiplicativeOp _nl @power)*
  { return h.makeInfixChain(head, tail, location()); }
  multiplicativeOp "operator" = '*' / '/' / '.*' / './'

power
  = head:chainFunctionCall tail:(_ @powerOp _nl @chainFunctionCall)*
  { return h.makeInfixChain(head, tail, location()); }
  powerOp "operator" = '^' / '.^'

chainFunctionCall
  = head:unary tail:(_ ('->' / '|>') _nl @chainedFunction)*
  {
    return tail.reduce(function(result, element) {
      return h.nodePipe(result, element.callable, element.args, location());
    }, head);
  }

  chainedFunction
    = fn:callableBasicValue '(' _nl args:functionArguments _nl ')'
      { return { callable: fn, args }; }
    / fn:callableBasicValue
      { return { callable: fn, args: [] }; }

  callableBasicValue = staticCollectionElement / valueConstructor / variable

// Unary operator

unary
  = unaryOperator:unaryOperator _nl right:(unary/postOperator)
  { return h.nodeUnaryCall(unaryOperator, right, location())}
  / postOperator

  unaryOperator "unary operator" = '-' / '.-' / '!'

// Function calls and field lookups

postOperator
  = collectionElement
  / atom

staticCollectionElement
  = head:atom &('['/'.') // should we allow whitespace before the first []?
    tail:(
      _ '[' _nl arg:expression  _nl ']' {return {mode: 'bracket', arg}}
    / '.' arg:$dollarIdentifier {return {mode: 'dot', arg}} // TODO: should we allow whitespace before "."?
    )*
  {
    return tail.reduce(function(result, element) {
      switch (element.mode) {
        case 'dot':
          return h.nodeDotLookup(result, element.arg, location());
        case 'bracket':
          return h.nodeBracketLookup(result, element.arg, location());
        default:
          throw new Error("Parser implementation error");
      }
    }, head);
  }

collectionElement
  = head:atom &('['/'('/'.')
    tail:(
      _ '(' _nl args:functionArguments _nl ')'
      { return {mode: 'call', args}; }
    / _ '[' _nl arg:expression _nl ']'
      { return {mode: 'bracket', arg}; }
    / '.' arg:$dollarIdentifier
      { return {mode: 'dot', arg}; }
    )*
  {
    return tail.reduce(function(result, element) {
      switch (element.mode) {
        case 'call':
          return h.nodeCall(result, element.args, location());
        case 'dot':
          return h.nodeDotLookup(result, element.arg, location());
        case 'bracket':
          return h.nodeBracketLookup(result, element.arg, location());
        default:
          throw new Error("Parser implementation error");
      }
    }, head);
  }

functionArguments = expression|.., commaSeparator|

atom
  = '(' _nl @expression _nl ')'
  / basicValue

basicValue = valueConstructor / basicLiteral

// Basic literals such as numbers, strings and booleans

basicLiteral
  = string
  / number
  / boolean
  / variable
  / voidLiteral

voidLiteral 'void'
  = "()" {return h.nodeVoid(location());}

variable = dollarIdentifierWithModule / dollarIdentifier

dollarIdentifierWithModule 'identifier'
  = head:$moduleIdentifier
    tail:('.' _nl @$moduleIdentifier)* '.' _nl
    final:$dollarIdentifier
  {
    let modifiers = [...tail];
    modifiers.unshift(head);
    modifiers.push(final);
    const modifiedIdentifier = modifiers.join('.');
    return h.nodeIdentifier(modifiedIdentifier, location());
  }

identifier 'identifier'
  = ([_a-z]+[_a-z0-9]i*) { return h.nodeIdentifier(text(), location()); }

unitIdentifier 'identifier'
  = ([_a-zA-Z]+[_a-z0-9]i*) { return h.nodeIdentifier(text(), location()); }

dollarIdentifier 'identifier'
  = ([\$_a-z]+[\$_a-z0-9]i*) { return h.nodeIdentifier(text(), location()); }

moduleIdentifier 'identifier'
  = ([A-Z]+[_a-z0-9]i*) { return h.nodeModuleIdentifier(text(), location()); }


string 'string'
  = characters:("'" @([^'])* "'") { return h.nodeString(characters.join(''), location()); }
  / characters:('"' @([^"])* '"') { return h.nodeString(characters.join(''), location()); }

number = number:(float / integer) unit:unitIdentifier?
  {
    if (unit === null) {
      return number;
    }
    else {
      return h.nodeCall(h.nodeIdentifier(`fromUnit_${unit.value}`, location()), [number], location());
    }
  }

integer 'number'
  = d+ !"\." ![e]i
  { return h.nodeInteger(parseInt(text()), location()); }

float 'number'
  = $(((d+ "\." d*) / ("\." d+)) floatExponent? / d+ floatExponent)
  { return h.nodeFloat(parseFloat(text()), location()); }

    floatExponent = [e]i ('-'/'+')? d+
    d = [0-9]

boolean 'boolean'
  = ('true' / 'false') ! [a-z]i ! [_$]
  { return h.nodeBoolean(text() === 'true', location()); }

// Contructors - delimited blocks such as {} and []

valueConstructor
  = recordConstructor
  / arrayConstructor
  / lambda
  / quotedInnerBlock

lambda
  = '{' _nl '|' _nl args:functionParameters _nl '|' _nl statements:statementsList  finalExpression: (statementSeparator @expression)  _nl '}'
  {
    statements.push(finalExpression);
    return h.nodeLambda(args, h.nodeBlock(statements, location()), location(), undefined);
  }
  / '{' _nl '|' _nl args:functionParameters _nl '|' _nl finalExpression: expression  _nl '}'
  { return h.nodeLambda(args, finalExpression, location(), undefined); }

arrayConstructor 'array'
  = '[' _nl ']'
    { return h.constructArray([], location()); }
  / '[' _nl args:array_elements _nl ']'
    { return h.constructArray(args, location()); }

  array_elements = @expression|1.., commaSeparator| commaSeparator?

recordConstructor 'record'
  = '{' _nl '}'
    { return h.constructRecord([], location()); }
  / '{' _nl args:array_recordEntries _nl '}'
    { return h.constructRecord(args, location()); }

  array_recordEntries = @keyValuePair|1.., commaSeparator| commaSeparator?

  keyValuePair
    = key:expression _ ':' _nl value:expression
    { return h.nodeKeyValue(key, value, location()); }

// Separators

_ 'whitespace'
  = whiteSpaceCharactersOrComment*

_nl 'whitespace'
  = (whiteSpaceCharactersOrComment / commentOrNewLine)*

__ 'whitespace'
  = whiteSpaceCharactersOrComment+

__nl 'whitespace'
  = (whiteSpaceCharactersOrComment / commentOrNewLine)+

statementSeparator ';'
  = _ (';' / commentOrNewLine)+ _nl

commaSeparator ',' = _ ',' _nl

commentOrNewLine = finalComment? newLine
  newLine "newline" = [\n\r]

finalComment "line comment"
  = _ ('//'/'#') comment:($([^\r\n]*)) { options.comments.push(h.lineComment(comment, location())); }

whiteSpaceCharactersOrComment = whiteSpaceCharacters / delimitedComment

  delimitedComment  "comment"
    = '/*' comment:($([^*]*)) '*/' { options.comments.push(h.blockComment(comment, location())); }

  whiteSpaceCharacters = [ \t]

