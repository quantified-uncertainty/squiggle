// Documentation: https://peggyjs.org/documentation.html

{{
  import * as h from './peggyHelpers.js';
}}

start
  = _nl start:outerBlock _nl lineComment? // not just `_nl`, because last line doesn't need to end in new line
    { return start; }

outerBlock
  = imports:importStatementsList
    statements:statementsList
    finalExpression:(statementSeparator @expression)?
    {
      return h.nodeProgram(imports, statements, finalExpression, location());
    }
  / imports:importStatementsList
    finalExpression:expression
    { return h.nodeProgram(imports, [], finalExpression, location()); }
  / imports:importStatementsList
    { return h.nodeProgram(imports, [], null, location()); }

importStatementsList = (@importStatement __nl)*

importStatement
  = _nl 'import' __nl file:string variable:(__nl 'as' __nl @identifier)
    { return h.nodeImport(file, variable, location()); }

innerBlockOrExpression
  = quotedInnerBlock
  / finalExpression:expression

quotedInnerBlock
  = '{' _nl
    statements:statementsList
    result:(statementSeparator @expression) _nl
    '}'
    {
      return h.nodeBlock(statements, result, location());
    }
  / '{' _nl
    result:expression _nl
    '}'
    { return h.nodeBlock([], result, location()); }

statementsList = statement|1.., statementSeparator|

decorator
  = '@' name:dollarIdentifier args:(_ '(' _nl @functionArguments _nl ')')?  __nl
    {
      return h.nodeDecorator(name, args ?? [], location());
    }

unitTypeSignature
  = _ "::" _ body:infixUnitType
    {
      return h.nodeTypeSignature(body, location());
    }

infixUnitType
  = head:exponentialUnitType _ tail:(@typeMultiplicativeOp _ @exponentialUnitType)*
    { return h.makeInfixTypeChain(head, tail, location()); }
  typeMultiplicativeOp "operator" = '*' / '/'

exponentialUnitType
  = unit:(unitName / float) _ "^" _ exponent:float
    { return h.nodeExponentialUnitType(unit, exponent, location()); }
  / unit:(unitName / float)
    { return unit; }

unitName
  = identifier:identifier
    { return h.nodeUnitNameFromIdentifier(identifier, location()); }

statement
  = letStatement
  / defunStatement

letStatement
  = decorators:decorator* exported:("export" __nl)? variable:dollarIdentifier unitTypeSignature:unitTypeSignature? _ assignmentOp _nl value:innerBlockOrExpression
    { return h.nodeLetStatement(decorators, variable, unitTypeSignature, value, Boolean(exported), location()); }

defunStatement
  = decorators:decorator* exported:("export" __nl)? variable:dollarIdentifier '(' _nl args:functionParameters _nl ')' returnUnitType:unitTypeSignature? _ assignmentOp _nl body:innerBlockOrExpression
    {
      const value = h.nodeLambda(args, body, location(), variable, returnUnitType);
      return h.nodeDefunStatement(decorators, variable, value, Boolean(exported), location());
    }

  assignmentOp "assignment" = '='

functionParameters = functionParameter|.., commaSeparator|
  functionParameter
    = id:dollarIdentifier annotation:(_ ':' _nl @expression)? paramUnitType:unitTypeSignature?
      {
        return h.nodeLambdaParameter(id, annotation, paramUnitType, location());
      }

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
  = head:additive tail:(__nl @credibleIntervalOp __nl @additive)*
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
  = left:chainFunctionCall _ operator:powerOp _nl right:power
    { return h.nodeInfixCall(operator, left, right, location()); }
  / chainFunctionCall
  powerOp "operator" = '^' / '.^'

chainFunctionCall
  = head:unary tail:(_nl ('->') _nl @chainedFunction)*
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

variable = dollarIdentifierWithModule / dollarIdentifier

dollarIdentifierWithModule 'identifier'
  = head:$moduleIdentifier
    final:('.' @$dollarIdentifier)?
    {
      let modifiers = [head];
      Boolean(final) && modifiers.push(final);
      const modifiedIdentifier = modifiers.join('.');
      return h.nodeIdentifier(modifiedIdentifier, location());
    }
  moduleIdentifier 'identifier' = ([A-Z]+[_a-z0-9]i*)

identifier 'identifier'
  = ([_a-z]+[_a-z0-9]i*) { return h.nodeIdentifier(text(), location()); }

unitIdentifier 'identifier'
  = 'minutes' / 'hours' / 'days' / 'years' / 'year' / 'n' / 'm' / 'k' / 'M' / 'B' / 'G' / 'T' / 'P' / '%'

dollarIdentifier 'identifier'
  = ([\$_a-z]+[\$_a-z0-9]i*) { return h.nodeIdentifier(text(), location()); }

escapeSeq 'escape sequence'
  = "\\"
     @( esc:[^u]          { return h.parseEscapeSequence([esc], location(), error) }
      / esc:("u" . . . .) { return h.parseEscapeSequence(esc, location(), error) }
      )

string 'string'
  = "'" characters:(!("'" / "\\") @. / escapeSeq)* "'" { return h.nodeString(characters.join(""), location()); }
  / '"' characters:(!('"' / "\\") @. / escapeSeq)* '"' { return h.nodeString(characters.join(""), location()); }

number
  = number:float unit:unitIdentifier?
  {
    if (unit === null) {
      return number;
    }
    else {
      return h.nodeUnitValue(number, unit, location());
    }
  }

float 'number'
  = significand:floatSignificand exponent:floatExponent?
    {
      return h.nodeFloat({
        integer: significand.integer,
        fractional: significand.fractional,
        exponent,
      }, location());
    }

  floatSignificand
    = integer:intLiteral "." fractional:($d+)?
      {
        return {
          integer,
          fractional,
        };
      }
    / integer:intLiteral
      {
        return {
          integer,
          fractional: null,
        };
      }
    / "." fractional:$(d+)
      {
        return {
          integer: 0,
          fractional,
        };
      }

  floatExponent = [e]i @value:signedIntLiteral
  intLiteral = d+ { return parseInt(text(), 10); }
  signedIntLiteral = ('-'/'+')? d+ { return parseInt(text(), 10); }
  d = [0-9]

boolean 'boolean'
  = ('true' / 'false') ! [a-z]i ! [_$]
    { return h.nodeBoolean(text() === 'true', location()); }

// Contructors - delimited blocks such as {} and []

valueConstructor
  = arrayConstructor
  / lambda
  / quotedInnerBlock
  / dictConstructor

lambda
  = '{' _nl '|' _nl args:functionParameters _nl '|' _nl statements:statementsList  result:(statementSeparator @expression)  _nl '}' returnUnitType:unitTypeSignature?
    {
      return h.nodeLambda(
        args,
        h.nodeBlock(statements, result, location()),
        location(),
        undefined,
        returnUnitType
      );
    }
  / '{' _nl '|' _nl args:functionParameters _nl '|' _nl result:expression  _nl '}'  returnUnitType:unitTypeSignature?
    {
      return h.nodeLambda(
        args,
        result,
        location(),
        undefined,
        returnUnitType
      );
    }

arrayConstructor 'array'
  = '[' _nl ']'
    { return h.nodeArray([], location()); }
  / '[' _nl args:array_elements _nl ']'
    { return h.nodeArray(args, location()); }

  array_elements = @expression|1.., commaSeparator| commaSeparator?

dictConstructor 'dict'
  = '{' _nl '}'
    { return h.nodeDict([], location()); }
  / '{' _nl args:array_dictEntries _nl '}'
    { return h.nodeDict(args, location()); }

  array_dictEntries = @(
    keyValuePair
    / identifier // shorthand
  )| 1.., commaSeparator|commaSeparator?

  keyValuePair
    = key:expression _ ':' _nl value:expression
      { return h.nodeKeyValue(key, value, location()); }

// Separators

statementSeparator ';'
  = (_ ';' / _ newLineWithPossibleComment)+ _nl

commaSeparator ',' = _ ',' _nl

// optional whitespace without line breaks (line breaks are still allowed inside block comments)
_ 'whitespace'
  = whiteSpaceCharactersOrComment*

// optional whitespace with possible line breaks and comments
_nl 'whitespace'
  = (whiteSpaceCharactersOrComment / newLineWithPossibleComment)*

// required whitespace with possible line breaks and comments
__nl 'whitespace'
  = (whiteSpaceCharactersOrComment / newLineWithPossibleComment)+

newLineWithPossibleComment = lineComment? newLine
  newLine "newline" = [\n\r]

lineComment "line comment"
  = '//' comment:($([^\r\n]*))
    { options.addComment(h.lineComment(comment, location())); }

whiteSpaceCharactersOrComment = whiteSpaceCharacters / blockComment

  blockComment "comment"
    = '/*' comment:($(
        ([^*] / [*][^/])*
      )) '*/'
      { options.addComment(h.blockComment(comment, location())); }

  whiteSpaceCharacters = [ \t]
