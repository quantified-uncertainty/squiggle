// Try in https://peggyjs.org/online

{{
  const h = require('./helpers');
}}

start
  = _nl start:outerBlock _nl finalComment?  {return start}

zeroOMoreArgumentsBlockOrExpression = innerBlockOrExpression / lambda

outerBlock 
  = statements:array_statements  finalExpression: (statementSeparator @expression)?
    { if (finalExpression != null) { statements.push(finalExpression) }
        return h.nodeBlock(statements) }
  / finalExpression: expression
    { return h.nodeBlock([finalExpression])}
    
innerBlockOrExpression  
  = quotedInnerBlock
  / finalExpression: expression
    { return h.nodeBlock([finalExpression])}

quotedInnerBlock  
  = '{' _nl statements:array_statements  finalExpression: (statementSeparator @expression)  _nl '}'
      { statements.push(finalExpression) 
        return h.nodeBlock(statements) }
  / '{' _nl finalExpression: expression  _nl '}'
      { return h.nodeBlock([finalExpression]) }

array_statements
  = head:statement tail:(statementSeparator @array_statements )
    { return [head, ...tail] }
  / head:statement
      { return [head] }

statement 
  = letStatement
  / defunStatement
  / typeStatement
  / voidStatement

voidStatement 
  = "call" _nl value:zeroOMoreArgumentsBlockOrExpression
    { var variable = h.nodeIdentifier("_", location());
      return h.nodeLetStatement(variable, value); }

letStatement 
  = variable:identifier _ assignmentOp _nl value:zeroOMoreArgumentsBlockOrExpression
    { return h.nodeLetStatement(variable, value) }

defunStatement
  = variable:identifier '(' _nl args:array_parameters _nl ')' _ assignmentOp _nl body:innerBlockOrExpression
    { var value = h.nodeLambda(args, body)
      return h.nodeLetStatement(variable, value) }

  assignmentOp "assignment" = '='

array_parameters 
  = head:dollarIdentifier tail:(_ ',' _nl @dollarIdentifier)* 
    { return [head, ...tail]; }
  / ""
    { return [h.nodeIdentifier("_", location())]; }

expression = ifthenelse / ternary / logicalAdditive

ifthenelse 
  = 'if' __nl condition:logicalAdditive 
      __nl 'then' __nl trueExpression:innerBlockOrExpression 
    __nl 'else' __nl falseExpression:(ifthenelse/innerBlockOrExpression)
    { return h.nodeTernary(condition, trueExpression, falseExpression) }
  
ternary 
  = condition:logicalAdditive _ '?' _nl trueExpression:logicalAdditive _ ':' _nl falseExpression:(ternary/logicalAdditive)
    { return h.nodeTernary(condition, trueExpression, falseExpression) }

logicalAdditive
  = head:logicalMultiplicative tail:(_ operator:logicalAdditiveOp _nl arg:logicalMultiplicative {return {operator: operator, right: arg}})* 
  { return tail.reduce(function(result, element) {
      return h.makeFunctionCall(h.toFunction[element.operator], [result, element.right])
    }, head)}

  logicalAdditiveOp "operator" = '||'

// start binary operators
logicalMultiplicative
  = head:equality tail:(_ operator:logicalMultiplicativeOp _nl arg:equality {return {operator: operator, right: arg}})* 
  { return tail.reduce(function(result, element) {
      return h.makeFunctionCall(h.toFunction[element.operator], [result, element.right])
    }, head)}

  logicalMultiplicativeOp "operator" = '&&'

equality
  = left:relational _ operator:equalityOp _nl right:relational 
  { return h.makeFunctionCall(h.toFunction[operator], [left, right])}
  / relational  
  
  equalityOp "operator" = '=='/'!='

relational
  = left:additive _ operator:relationalOp _nl right:additive 
  { return h.makeFunctionCall(h.toFunction[operator], [left, right])}
  / additive

  relationalOp "operator" = '<='/'<'/'>='/'>'

additive
  = head:multiplicative tail:(_ operator:additiveOp _nl arg:multiplicative {return {operator: operator, right: arg}})* 
  { return tail.reduce(function(result, element) {
      return h.makeFunctionCall(h.toFunction[element.operator], [result, element.right])
    }, head)}

  additiveOp "operator" = '+' / '-' / '.+' / '.-'

multiplicative
  = head:power tail:(_ operator:multiplicativeOp _nl arg:power {return {operator: operator, right: arg}})* 
  { return tail.reduce(function(result, element) {
      return h.makeFunctionCall(h.toFunction[element.operator], [result, element.right])
    }, head)}

  multiplicativeOp "operator" = '*' / '/' / '.*' / './'

power
  = head:credibleInterval tail:(_ operator:powerOp _nl arg:credibleInterval {return {operator: operator, right: arg}})* 
  { return tail.reduce(function(result, element) {
      return h.makeFunctionCall(h.toFunction[element.operator], [result, element.right])
    }, head)}

  powerOp "operator" = '^' / '.^'

credibleInterval
  = head:chainFunctionCall tail:(__ operator:credibleIntervalOp __nl arg:chainFunctionCall {return {operator: operator, right: arg}})* 
  { return tail.reduce(function(result, element) {
      return h.makeFunctionCall(h.toFunction[element.operator], [result, element.right])
    }, head)}

    credibleIntervalOp "operator" = 'to'

chainFunctionCall
  = head:unary tail:(_ ('->'/'|>') _nl chained:chainedFunction {return chained})* 
  { return tail.reduce(function(result, element) {
      return h.makeFunctionCall(element.fnName, [result, ...element.args])
    }, head)}

  chainedFunction
    = fn:dollarIdentifier '(' _nl args:array_functionArguments _nl ')' 
      { return {fnName: fn.value, args: args}}
      / fn:dollarIdentifier '(' _nl ')' 
      { return {fnName: fn.value, args: []}}
      / fn:dollarIdentifier
      { return {fnName: fn.value, args: []}}

// end of binary operators

unary
  = unaryOperator:unaryOperator _nl right:(unary/postOperator)
  { return h.apply(h.unaryToFunction[unaryOperator], right)}
  / postOperator
  
  unaryOperator "unary operator"
  = ('-' / '.-' / '!' ) 

postOperator
  = collectionElement
  / atom

collectionElement
  = head:atom &('['/'('/'.')
    tail:(
      _ '[' _nl arg:expression  _nl ']' {return {fn: h.postOperatorToFunction['[]'], args: [arg]}}
    / _ '(' _nl args:array_functionArguments  _nl ')' {return {fn: h.postOperatorToFunction['()'], args: args}}
    / '.' arg:$dollarIdentifier {return {fn: h.postOperatorToFunction['[]'], args: [h.nodeString(arg)]}}
    )* 
  { return tail.reduce(function(result, element) {
      return h.makeFunctionCall(element.fn, [result, ...element.args])
    }, head)}

    array_functionArguments 
      = head:expression tail:(_ ',' _nl @expression)* 
      { return [head, ...tail]; }
  / ""
      {return [h.nodeVoid()];}

atom
  = '(' _nl expression:expression _nl ')' {return expression}
  / basicValue

basicValue = valueConstructor / basicLiteral

basicLiteral
  = string
  / number
  / boolean
  / dollarIdentifierWithModule
  / dollarIdentifier
  / voidLiteral

voidLiteral 'void'
  = "()" {return h.nodeVoid();}

dollarIdentifierWithModule 'identifier'
  = head:$moduleIdentifier 
    tail:('.' _nl @$moduleIdentifier)* '.' _nl 
    final:$dollarIdentifier
  { 
    let modifiers = [...tail]
    modifiers.unshift(head)
    modifiers.push(final)
    let modifiedIdentifier = modifiers.join('.')
    return h.nodeIdentifier(modifiedIdentifier, location())
  }

identifier 'identifier'
  = ([_a-z]+[_a-z0-9]i*) {return h.nodeIdentifier(text(), location())} 

unitIdentifier 'identifier'
  = ([_a-zA-Z]+[_a-z0-9]i*) {return h.nodeIdentifier(text(), location())} 

dollarIdentifier '$identifier'
  = ([\$_a-z]+[\$_a-z0-9]i*) {return h.nodeIdentifier(text(), location())} 

moduleIdentifier 'identifier'
  = ([A-Z]+[_a-z0-9]i*) {return h.nodeModuleIdentifier(text())} 


string 'string'
  = characters:("'" @([^'])* "'") {return h.nodeString(characters.join(''))} 
  / characters:('"' @([^"])* '"') {return h.nodeString(characters.join(''))}

number = number:(float / integer) unit:unitIdentifier?
  { 
    if (unit === null)
      { return number }
    else
      { return h.apply('fromUnit_'+unit.value, number) 
      }
  }

integer 'integer'
  = d+ !"\." ![e]i
  { return h.nodeInteger(parseInt(text()))} 
  
float 'float'
  = $(((d+ "\." d*) / ("\." d+)) floatExponent? / d+ floatExponent)
  { return h.nodeFloat(parseFloat(text()))} 

    floatExponent = [e]i '-'? d+
    d = [0-9]
    
boolean 'boolean'
  = ('true'/'false') 
  { return h.nodeBoolean(text() === 'true')}   

valueConstructor
  = recordConstructor
  / arrayConstructor
  / lambda
  / quotedInnerBlock 

lambda  
  = '{' _nl '|' _nl args:array_parameters _nl '|' _nl statements:array_statements  finalExpression: (statementSeparator @expression)  _nl '}'
      { statements.push(finalExpression) 
        return h.nodeLambda(args, h.nodeBlock(statements)) }
  / '{' _nl '|' _nl args:array_parameters _nl '|' _nl finalExpression: expression  _nl '}'
      { return h.nodeLambda(args, h.nodeBlock([finalExpression])) }

arrayConstructor 'array'
  = '[' _nl ']'
    { return h.constructArray([]); }
  / '[' _nl args:array_elements _nl ']' 
    { return h.constructArray(args); }

  array_elements 
    = head:expression tail:(_ ',' _nl @expression)* 
    { return [head, ...tail]; }

recordConstructor  'record'
  = '{' _nl args:array_recordArguments _nl '}' 
  { return h.constructRecord(args); }

  array_recordArguments 
    = head:keyValuePair tail:(_ ',' _nl @keyValuePair)* 
    { return [head, ...tail]; }

  keyValuePair 
    = key:expression _ ':' _nl value:expression 
    { return h.nodeKeyValue(key, value)}

// Separators

_ 'whitespace'
  = whiteSpaceCharactersOrComment*

_nl 'whitespace or newline'
  = (whiteSpaceCharactersOrComment / commentOrNewLine)*

__ 'whitespace'
  = whiteSpaceCharactersOrComment+

__nl 'whitespace or newline'
  = (whiteSpaceCharactersOrComment / commentOrNewLine )+

statementSeparator 'statement separator'
    = _ (';'/ commentOrNewLine)+ _nl

  commentOrNewLine = finalComment? newLine 

    finalComment "line comment"
      = _ ('//'/'#') @([^\r\n]*) 

  whiteSpaceCharactersOrComment = whiteSpaceCharacters / delimitedComment

    delimitedComment  "comment"
      = '/*' @([^*]*) '*/'

    whiteSpaceCharacters = [ \t]

    newLine "newline"
      = [\n\r]

// Types

noArguments = ('(' _nl ')' )?

typeIdentifier 'type identifier'
  = ([a-z]+[_a-z0-9]i*) {return h.nodeTypeIdentifier(text())} 

typeConstructorIdentifier 'type constructor identifier'
  = ([A-Z]+[_a-z0-9]i*) {return h.nodeTypeIdentifier(text())} 

typeExpression = typePostModifierExpression

typePostModifierExpression = head:typeOr tail:(_ '$' _nl @typeModifier)*
  { 
    return tail.reduce((result, element) => {
      return h.makeFunctionCall('$_typeModifier_'+element.modifier.value+'_$', [result, ...element.args])
    }, head)
  }

typeOr = head:typeFunction tail:(_ '|' _nl @typeFunction)*
  { return tail.length === 0 ? head : h.apply('$_typeOr_$', h.constructArray([head, ...tail])); }

typeFunction = head:typeModifierExpression tail:(_ '=>' _nl @typeModifierExpression)*    
  { return tail.length === 0 ? head : h.apply( '$_typeFunction_$', h.constructArray([head, ...tail])); }

typeModifierExpression = head:basicType tail:(_ '<-' _nl @typeModifier)* 
  { 
    return tail.reduce((result, element) => {
      return h.makeFunctionCall('$_typeModifier_'+element.modifier.value+'_$', [result, ...element.args])
    }, head)
  }

  typeModifier 
    = modifier:identifier _ '(' _nl args:array_elements _nl ')' 
      { return {modifier: modifier, args: args}; }
    / modifier:identifier _ noArguments
      { return {modifier: modifier, args: []}; }
  
basicType = typeConstructor / typeArray / typeTuple / typeRecord / typeInParanthesis / typeIdentifier

typeArray = '[' _nl elem:typeExpression _nl ']' 
  {return h.apply('$_typeArray_$', elem)}

typeTuple = '[' _nl elems:array_typeTupleArguments _nl ']' 
  { return h.apply('$_typeTuple_$', h.constructArray(elems))}

  array_typeTupleArguments
    = head:typeExpression tail:(_ ',' _nl @typeExpression)* 
    { return [head, ...tail]; }

typeRecord = '{' _nl elems:array_typeRecordArguments _nl '}' 
  { return h.apply('$_typeRecord_$', h.constructRecord(elems)); }  

  array_typeRecordArguments 
    = head:typeKeyValuePair tail:(_ ',' _nl @typeKeyValuePair)* 
    { return [head, ...tail]; }

  typeKeyValuePair 
    = key:identifier _ ':' _nl value:typeExpression 
    { return h.nodeKeyValue(key, value)}

typeConstructor 
  = constructor:typeConstructorIdentifier _ '(' _nl args:array_types _nl ')' 
    { return h.makeFunctionCall('$_typeConstructor_$', [constructor, h.constructArray(args)]); }
  / constructor:typeConstructorIdentifier _ noArguments
    { return h.makeFunctionCall('$_typeConstructor_$', [constructor, h.constructArray([])]); }

  array_types = head:typeExpression tail:(_ ',' _nl @typeExpression)* 
    { return [head, ...tail]; }

typeStatement = typeAliasStatement / typeOfStatement
typeAliasStatement = 'type' __nl typeIdentifier:typeIdentifier _nl '=' _nl typeExpression:typeExpression 
  { return h.makeFunctionCall('$_typeAlias_$', [typeIdentifier, typeExpression])}
typeOfStatement = identifier:identifier _ ':' _nl typeExpression:typeExpression
  { return h.makeFunctionCall('$_typeOf_$', [identifier, typeExpression])}

typeInParanthesis = '(' _nl typeExpression:typeExpression _nl ')' {return typeExpression}
