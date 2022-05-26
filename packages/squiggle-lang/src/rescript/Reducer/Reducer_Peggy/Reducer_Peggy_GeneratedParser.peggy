// Try in https://peggyjs.org/online

{{
  var toFunction = {
    '-': 'subtract',
    '->': 'pipe',
    '!=': 'unequal',
    '.-': 'dotSubtract',
    '.*': 'dotMultiply',
    './': 'dotDivide',
    '.^': 'dotPow',
    '.+': 'dotAdd',
    '*': 'multiply',
    '/': 'divide',
    '&&': 'and',
    '^': 'pow', // or xor
    '+': 'add',
    '<': 'smaller',
    '<=': 'smallerEq',
    '==': 'equal',
    '>': 'larger',
    '>=': 'largerEq',
    '||': 'or',
    'to': 'credibleIntervalToDistribution',
  } 

  var unaryToFunction = {
    '-': 'unaryMinus', 
    '!': 'not',
    '.-': 'unaryDotMinus',
  }

  var postOperatorToFunction = {
    '.': '$_atIndex_$',
    '()': '$$_applyAll_$$',
    '[]': '$_atIndex_$',
  }

  function makeFunctionCall(fn, args) {
    if (fn === '$$_applyAll_$$') {
      // Any list of values is applied from left to right anyway. 
      // Like in Haskell and Lisp.
      // So we remove the redundant $$_applyAll_$$.
      if (args[0].type === "Identifier") {args[0].type = "CallIdentifier"}
      return nodeExpression(args) 
    } else {
      return nodeExpression([nodeCallIndentifier(fn), ...args]) 
    }
  }

  function apply(fn, arg) { return makeFunctionCall(fn, [arg]); }
  function constructArray(elems)  { return apply('$_constructArray_$', nodeExpression(elems)); }
  function constructRecord(elems) { return apply('$_constructRecord_$', nodeExpression(elems)); }

  function nodeBlock(statements) {return{type: 'Block', statements: statements}}
  function nodeBoolean(value) {return {type: 'Boolean', value: value}}
  function nodeCallIndentifier(value) {return {type: 'CallIdentifier', value: value}}
  function nodeExpression(args) {return {type: 'Expression', nodes: args}}
  function nodeFloat(value) {return {type: 'Float', value: value}}
  function nodeIdentifier(value) {return {type: 'Identifier', value: value}}
  function nodeInteger(value) {return {type: 'Integer', value: value}}
  function nodeKeyValue(key, value) { 
    if (key.type === 'Identifier') {key.type = 'String'}
    return {type: 'KeyValue', key: key, value: value}}  
  function nodeLambda(args, body) {return {type: 'Lambda', args: args, body: body}}
  function nodeLetStatment(variable, value) {return {type: 'LetStatement', variable: variable, value: value}}
  function nodeString(value) {return {type: 'String', value: value}}
  function nodeTernary(condition, trueExpression, falseExpression) {return {type: 'Ternary', condition: condition, trueExpression: trueExpression, falseExpression: falseExpression}}
  
  function nodeTypeIdentifier(typeValue) {return {type: 'TypeIdentifier', value: typeValue}}
}}

start
  // = _nl start:typeExpression _nl finalComment?  {return start}
  = _nl start:outerBlock _nl finalComment?  {return start}

zeroOMoreArgumentsBlockOrExpression = innerBlockOrExpression / lambda

outerBlock 
	= statements:array_statements  finalExpression: (statementSeparator @expression)?
    { if (finalExpression != null) { statements.push(finalExpression) }
        return nodeBlock(statements) }
  / finalExpression: expression
    { return nodeBlock([finalExpression])}
    
innerBlockOrExpression  
  = quotedInnerBlock
  / finalExpression: expression
    { return nodeBlock([finalExpression])}

quotedInnerBlock  
  = '{' _nl statements:array_statements  finalExpression: (statementSeparator @expression)  _nl '}'
	  { statements.push(finalExpression) 
    	return nodeBlock(statements) }
  / '{' _nl finalExpression: expression  _nl '}'
	  { return nodeBlock([finalExpression]) }

array_statements
  = head:statement tail:(statementSeparator @array_statements )
    { return [head, ...tail] }
  / head:statement
  	{ return [head] }

statement 
  = letStatement
  / defunStatement
  / typeStatement

letStatement 
  = variable:identifier _ assignmentOp _nl value:zeroOMoreArgumentsBlockOrExpression
  { return nodeLetStatment(variable, value) }

defunStatement
  = variable:identifier '(' _nl args:array_parameters _nl ')' _ assignmentOp _nl body:innerBlockOrExpression
    { var value = nodeLambda(args, body)
      return nodeLetStatment(variable, value) }

  assignmentOp "assignment" = '='

array_parameters 
  = head:dollarIdentifier tail:(_ ',' _nl @dollarIdentifier)* 
  { return [head, ...tail]; }

expression = ifthenelse / ternary / logicalAdditive

ifthenelse 
  = 'if' __nl condition:logicalAdditive 
  	__nl 'then' __nl trueExpression:innerBlockOrExpression 
    __nl 'else' __nl falseExpression:(ifthenelse/innerBlockOrExpression)
    { return nodeTernary(condition, trueExpression, falseExpression) }
  
ternary 
  = condition:logicalAdditive _ '?' _nl trueExpression:logicalAdditive _ ':' _nl falseExpression:(ternary/logicalAdditive)
    { return nodeTernary(condition, trueExpression, falseExpression) }

logicalAdditive
  = head:logicalMultiplicative tail:(_ operator:logicalAdditiveOp _nl arg:logicalMultiplicative {return {operator: operator, right: arg}})* 
  { return tail.reduce(function(result, element) {
      return makeFunctionCall(toFunction[element.operator], [result, element.right])
    }, head)}

  logicalAdditiveOp "operator" = '||'

// start binary operators
logicalMultiplicative
  = head:equality tail:(_ operator:logicalMultiplicativeOp _nl arg:equality {return {operator: operator, right: arg}})* 
  { return tail.reduce(function(result, element) {
      return makeFunctionCall(toFunction[element.operator], [result, element.right])
    }, head)}

  logicalMultiplicativeOp "operator" = '&&'

equality
  = left:relational _ operator:equalityOp _nl right:relational 
  { return makeFunctionCall(toFunction[operator], [left, right])}
  / relational  
 
 equalityOp "operator" = '=='/'!='

relational
  = left:additive _ operator:relationalOp _nl right:additive 
  { return makeFunctionCall(toFunction[operator], [left, right])}
  / additive

  relationalOp "operator" = '<='/'<'/'>='/'>'

additive
  = head:multiplicative tail:(_ operator:additiveOp _nl arg:multiplicative {return {operator: operator, right: arg}})* 
  { return tail.reduce(function(result, element) {
      return makeFunctionCall(toFunction[element.operator], [result, element.right])
    }, head)}

  additiveOp "operator" = '+' / '-' / '.+' / '.-'

multiplicative
  = head:power tail:(_ operator:multiplicativeOp _nl arg:power {return {operator: operator, right: arg}})* 
  { return tail.reduce(function(result, element) {
      return makeFunctionCall(toFunction[element.operator], [result, element.right])
    }, head)}

  multiplicativeOp "operator" = '*' / '/' / '.*' / './'

power
  = head:credibleInterval tail:(_ operator:powerOp _nl arg:credibleInterval {return {operator: operator, right: arg}})* 
  { return tail.reduce(function(result, element) {
      return makeFunctionCall(toFunction[element.operator], [result, element.right])
    }, head)}

  powerOp "operator" = '^' / '.^'

credibleInterval
  = head:chainFunctionCall tail:(__ operator:credibleIntervalOp __nl arg:chainFunctionCall {return {operator: operator, right: arg}})* 
  { return tail.reduce(function(result, element) {
      return makeFunctionCall(toFunction[element.operator], [result, element.right])
    }, head)}

    credibleIntervalOp "operator" = 'to'

chainFunctionCall
  = head:unary tail:(_ ('->'/'|>') _nl chained:chainedFunction {return chained})* 
  { return tail.reduce(function(result, element) {
      return makeFunctionCall(element.fnName, [result, ...element.args])
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
  { return apply(unaryToFunction[unaryOperator], right)}
  / postOperator
  
  unaryOperator "unary operator"
  = ('-' / '.-' / '!' ) 

postOperator = indexedValue

indexedValue
  = collectionElement
  / recordElement
  / atom

  collectionElement
    = head:atom &('['/'('/'.')
      tail:(
        _ '[' _nl arg:expression  _nl ']' {return {fn: postOperatorToFunction['[]'], args: [arg]}}
      / _ '(' _nl args:array_functionArguments  _nl ')' {return {fn: postOperatorToFunction['()'], args: args}}
      / '.' arg:$dollarIdentifier {return {fn: postOperatorToFunction['[]'], args: [nodeString(arg)]}}
      )* 
    { return tail.reduce(function(result, element) {
        return makeFunctionCall(element.fn, [result, ...element.args])
      }, head)}

    array_functionArguments 
      = head:expression tail:(_ ',' _nl @expression)* 
      { return [head, ...tail]; }

recordElement
  = head:dollarIdentifier &'.' 
    tail:(_ '.' _nl arg:$dollarIdentifier {return {fn: postOperatorToFunction['.'],  args: [nodeString(arg)]}})* 
  { return tail.reduce(function(result, element) {
      return makeFunctionCall(element.fn, [result, ...element.args])
    }, head)}

atom
  = '(' _nl expression:expression _nl ')' {return expression}
  / basicValue

basicValue = valueConstructor / basicLiteral
 
basicLiteral
  = string
  / number
  / boolean
  / dollarIdentifier

identifier 'identifier'
  = ([_a-z]+[_a-z0-9]i*) {return nodeIdentifier(text())} 

dollarIdentifier '$identifier'
  = ([\$_a-z]+[\$_a-z0-9]i*) {return nodeIdentifier(text())} 

string 'string'
  = characters:("'" @([^'])* "'") {return nodeString(characters.join(''))} 
  / characters:('"' @([^"])* '"') {return nodeString(characters.join(''))}

number = number:(float / integer) unit:identifier?
  { 
    if (unit === null)
      { return number }
    else
      { return apply('fromUnit_'+unit.value, number) 
      }
  }

integer 'integer'
  = d+ !"\." ![e]i
  { return nodeInteger(parseInt(text()))} 
  
float 'float'
  = $(((d+ "\." d*) / ("\." d+)) floatExponent? / d+ floatExponent)
  { return nodeFloat(parseFloat(text()))} 

	floatExponent = [e]i '-'? d+
	d = [0-9]
    
boolean 'boolean'
  = ('true'/'false') 
  { return nodeBoolean(text() === 'true')}   

valueConstructor
  = recordConstructor
  / arrayConstructor
  / lambda
  / quotedInnerBlock 

lambda  
  = '{' _nl '|' _nl args:array_parameters _nl '|' _nl statements:array_statements  finalExpression: (statementSeparator @expression)  _nl '}'
	  { statements.push(finalExpression) 
    	return nodeLambda(args, nodeBlock(statements)) }
  / '{' _nl '|' _nl args:array_parameters _nl '|' _nl finalExpression: expression  _nl '}'
	  { return nodeLambda(args, nodeBlock([finalExpression])) }

arrayConstructor 'array'
  = '[' _nl ']'
    { return constructArray([]); }
  / '[' _nl args:array_elements _nl ']' 
    { return constructArray(args); }

  array_elements 
    = head:expression tail:(_ ',' _nl @expression)* 
    { return [head, ...tail]; }

recordConstructor  'record'
  = '{' _nl args:array_recordArguments _nl '}' 
  { return constructRecord(args); }

  array_recordArguments 
    = head:keyValuePair tail:(_ ',' _nl @keyValuePair)* 
    { return [head, ...tail]; }

  keyValuePair 
    = key:expression _ ':' _nl value:expression 
    { return nodeKeyValue(key, value)}

// Separators

_ 'whitespace'
  = whiteSpaceCharactersOrComment*

_nl 'optional whitespace or newline'
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
  = ([a-z]+[_a-z0-9]i*) {return nodeTypeIdentifier(text())} 

typeConstructorIdentifier 'type constructor identifier'
  = ([A-Z]+[_a-z0-9]i*) {return nodeTypeIdentifier(text())} 

typeExpression = typePostModifierExpression

typePostModifierExpression = head:typeOr tail:(_ '$' _nl @typeModifier)*
  { 
    return tail.reduce((result, element) => {
      return makeFunctionCall('$_typeModifier_'+element.modifier.value+'_$', [result, ...element.args])
    }, head)
  }

typeOr = head:typeFunction tail:(_ '|' _nl @typeFunction)*
  { return tail.length === 0 ? head : apply('$_typeOr_$', constructArray([head, ...tail])); }

typeFunction = head:typeModifierExpression tail:(_ '=>' _nl @typeModifierExpression)*    
  { return tail.length === 0 ? head : apply( '$_typeFunction_$', constructArray([head, ...tail])); }

typeModifierExpression = head:basicType tail:(_ '<-' _nl @typeModifier)* 
  { 
    return tail.reduce((result, element) => {
      return makeFunctionCall('$_typeModifier_'+element.modifier.value+'_$', [result, ...element.args])
    }, head)
  }

  typeModifier 
    = modifier:identifier _ '(' _nl args:array_elements _nl ')' 
      { return {modifier: modifier, args: args}; }
    / modifier:identifier _ noArguments
      { return {modifier: modifier, args: []}; }
  
basicType = typeConstructor / typeArray / typeRecord / typeInParanthesis / typeIdentifier

typeArray = '[' _nl elem:typeExpression _nl ']' 
  {return apply('$_typeArray_$', elem)}

typeRecord = '{' _nl elems:array_typeRecordArguments _nl '}' 
  { return apply('$_typeRecord_$', constructRecord(elems)); }  

  array_typeRecordArguments 
    = head:typeKeyValuePair tail:(_ ',' _nl @typeKeyValuePair)* 
    { return [head, ...tail]; }

  typeKeyValuePair 
    = key:identifier _ ':' _nl value:typeExpression 
    { return nodeKeyValue(key, value)}

typeConstructor 
  = constructor:typeConstructorIdentifier _ '(' _nl args:array_types _nl ')' 
    { return makeFunctionCall('$_typeConstructor_$', [constructor, constructArray(args)]); }
  / constructor:typeConstructorIdentifier _ noArguments
    { return makeFunctionCall('$_typeConstructor_$', [constructor, constructArray([])]); }

  array_types = head:typeExpression tail:(_ ',' _nl @typeExpression)* 
    { return [head, ...tail]; }

typeStatement = typeAliasStatement / typeOfStatement
typeAliasStatement = 'type' __nl typeIdentifier:typeIdentifier _nl '=' _nl typeExpression:typeExpression 
  { return makeFunctionCall('$_typeAlias_$', [typeIdentifier, typeExpression])}
typeOfStatement = identifier:identifier _ ':' _nl typeExpression:typeExpression
  { return makeFunctionCall('$_typeOf_$', [identifier, typeExpression])}

typeInParanthesis = '(' _nl typeExpression:typeExpression _nl ')' {return typeExpression}

// TODO: min max example
// TODO: Example of foo = {a: 2, b: 5}; type fooKeys = string $ memberOf(foo->keys)
// TODO: Example of memberOf( [1,2,3] )
// TODO: Example of $ 
// TODO: Cons(a, list) | EmptyList