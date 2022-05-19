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
    '.': '$atIndex',
    '()': '$$applyAll',
    '[]': '$atIndex',
  }

  function nodeBlock(statements) {return{type: 'Block', statements: statements}}
  function nodeBoolean(value) {return {type: 'Boolean', value: value}}
  function nodeCallIndentifier(value) {return {type: 'CallIdentifier', value: value}}
  function nodeExpression(args) {return {type: 'Expression', nodes: args}}
  function nodeFloat(value) {return {type: 'Float', value: value}}
  function makeFunctionCall(fn, args) {
    if (fn === '$$applyAll') {
      // Any list of values is applied from left to right anyway. 
      // Like in Haskell and Lisp.
      // So we remove the redundant $$applyAll.
      if (args[0].type === "Identifier") {args[0].type = "CallIdentifier"}
      return nodeExpression(args) 
    } else {
      return nodeExpression([nodeCallIndentifier(fn), ...args]) 
    }
  }
  function nodeIdentifier(value) {return {type: 'Identifier', value: value}}
  function nodeInteger(value) {return {type: 'Integer', value: value}}
  function nodeKeyValue(key, value) { 
    if (key.type === 'Identifier') {key.type = 'String'}
    return {type: 'KeyValue', key: key, value: value}}  
  function nodeLambda(args, body) {return {type: 'Lambda', args: args, body: body}}
  function nodeLetStatment(variable, value) {return {type: 'LetStatement', variable: variable, value: value}}
  function nodeString(value) {return {type: 'String', value: value}}
  function nodeTernary(condition, trueExpression, falseExpression) {return {type: 'Ternary', condition: condition, trueExpression: trueExpression, falseExpression: falseExpression}}
}}

start
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

letStatement 
  = variable:identifier _ '=' _nl value:zeroOMoreArgumentsBlockOrExpression

  { return nodeLetStatment(variable, value) }

defunStatement
  = variable:identifier '(' _nl args:array_parameters _nl ')' _ '=' _nl body:innerBlockOrExpression
    { var value = nodeLambda(args, body)
      return nodeLetStatment(variable, value) }

array_parameters 
  = head:identifier tail:(_ ',' _nl @identifier)* 
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
  = head:logicalMultiplicative tail:(_ operator:'||' _nl arg:logicalMultiplicative {return {operator: operator, right: arg}})* 
  { return tail.reduce(function(result, element) {
      return makeFunctionCall(toFunction[element.operator], [result, element.right])
    }, head)}

// start binary operators
logicalMultiplicative
  = head:equality tail:(_ operator:'&&' _nl arg:equality {return {operator: operator, right: arg}})* 
  { return tail.reduce(function(result, element) {
      return makeFunctionCall(toFunction[element.operator], [result, element.right])
    }, head)}

equality
  = left:relational _ operator:('=='/'!=') _nl right:relational 
  { return makeFunctionCall(toFunction[operator], [left, right])}
  / relational  
 
relational
  = left:additive _ operator:('<='/'<'/'>='/'>') _nl right:additive 
  { return makeFunctionCall(toFunction[operator], [left, right])}
  / additive

additive
  = head:multiplicative tail:(_ operator:('+' / '-' / '.+' / '.-') _nl arg:multiplicative {return {operator: operator, right: arg}})* 
  { return tail.reduce(function(result, element) {
      return makeFunctionCall(toFunction[element.operator], [result, element.right])
    }, head)}

multiplicative
  = head:power tail:(_ operator:('*' / '/' / '.*' / './') _nl arg:power {return {operator: operator, right: arg}})* 
  { return tail.reduce(function(result, element) {
      return makeFunctionCall(toFunction[element.operator], [result, element.right])
    }, head)}

power
  = head:credibleInterval tail:(_ operator:('^' / '.^') _nl arg:credibleInterval {return {operator: operator, right: arg}})* 
  { return tail.reduce(function(result, element) {
      return makeFunctionCall(toFunction[element.operator], [result, element.right])
    }, head)}

credibleInterval
  = head:chainFunctionCall tail:(__ operator:('to') __nl arg:chainFunctionCall {return {operator: operator, right: arg}})* 
  { return tail.reduce(function(result, element) {
      return makeFunctionCall(toFunction[element.operator], [result, element.right])
    }, head)}

chainFunctionCall
  = head:unary tail:(_ ('->'/'|>') _nl chained:chainedFunction {return chained})* 
  { return tail.reduce(function(result, element) {
      return makeFunctionCall(element.fnName, [result, ...element.args])
    }, head)}

  chainedFunction
    = fn:identifier '(' _nl args:array_functionArguments _nl ')' 
      { return {fnName: fn.value, args: args}}
      / fn:identifier '(' _nl ')' 
      { return {fnName: fn.value, args: []}}
      / fn:identifier
      { return {fnName: fn.value, args: []}}

// end of binary operators

unary
  = unaryOperator:unaryOperator _nl right:(unary/postOperator)
  { return makeFunctionCall(unaryToFunction[unaryOperator], [right])}
  / postOperator
  
  unaryOperator 
  = ('-' / '.-' / '!' ) 

postOperator = indexedValue

indexedValue
  = collectionElement
  / maybeRecordElement

  collectionElement
    = head:maybeRecordElement &('['/'(')
      tail:(
        _ '[' _nl arg:expression  _nl ']' {return {fn: postOperatorToFunction['[]'], args: [arg]}}
      / _ '(' _nl args:array_functionArguments  _nl ')' {return {fn: postOperatorToFunction['()'], args: args}}
      )* 
    { return tail.reduce(function(result, element) {
        return makeFunctionCall(element.fn, [result, ...element.args])
      }, head)}

    array_functionArguments 
      = head:expression tail:(_ ',' _nl @expression)* 
      { return [head, ...tail]; }

maybeRecordElement
  = recordElement
  / atom

  recordElement
    = head:identifier &'.' 
      tail:(_ '.' _nl arg:$identifier {return {fn: postOperatorToFunction['.'],  args: [nodeString(arg)]}})* 
    { return tail.reduce(function(result, element) {
        return makeFunctionCall(element.fn, [result, ...element.args])
      }, head)}

atom
  = '(' _nl expression:expression _nl ')' {return expression}
  / basicValue

basicValue = valueConstructor / basicLiteral
 
basicLiteral
  = string
  / float
  / integer
  / boolean
  / identifier

identifier 'identifier'
  = identifier:([_a-z]+[_a-z0-9]i*) {return nodeIdentifier(text())} 

string 'string'
  = characters:("'" @([^'])* "'") {return nodeString(characters.join(''))} 
  / characters:('"' @([^"])* '"') {return nodeString(characters.join(''))}

integer 'integer'
  = digits:[0-9]+![.] 
  { return nodeInteger(parseInt(text()))} 
  
float 'float'
  = ([0-9]+[.][0-9]*) 
  { return nodeFloat(parseFloat(text()))} 

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
    { return makeFunctionCall('$constructArray', [nodeExpression([])])}
  / '[' _nl args:array_elements _nl ']' 
    { return makeFunctionCall('$constructArray', [nodeExpression(args)])}

  array_elements 
    = head:expression tail:(_ ',' _nl @expression)* 
    { return [head, ...tail]; }

recordConstructor  'record'
  = '{' _nl args:array_recordArguments _nl '}' 
  { return makeFunctionCall('$constructRecord', [nodeExpression(args)])}

  array_recordArguments 
    = head:keyValuePair tail:(_ ',' _nl @keyValuePair)* 
    { return [head, ...tail]; }

  keyValuePair 
    = key:expression _ ':' _nl value:expression 
    { return nodeKeyValue(key, value)}
    
_ 'optional whitespace'
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

  